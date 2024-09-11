import datajoint as dj
import json
import os
import numpy as np
import datetime
import helpers.utils
import base64
from io import BytesIO
import h5py
from matplotlib.figure import Figure

Experiment: dj.Manual = None
Animal: dj.Manual = None
Preparation: dj.Manual = None
Cell: dj.Manual = None
EpochGroup: dj.Manual = None
EpochBlock: dj.Manual = None
Epoch: dj.Manual = None
Response: dj.Manual = None
Stimulus: dj.Manual = None
Protocol: dj.Manual = None
Tags: dj.Manual = None

db: dj.VirtualModule = None
table_arr: list = helpers.utils.table_arr
table_dict: dict = None
user: str = None
query: dj.expression.QueryExpression = None

def fill_tables(username: str, db_param: dj.VirtualModule):
    global db, user
    if not db or not user:
        user = username
        db = db_param
    global Experiment, Animal, Preparation, Cell, EpochGroup, EpochBlock, Epoch, Response, Stimulus, Protocol, Tags
    global table_dict
    Experiment = db.Experiment
    Animal = db.Animal
    Preparation = db.Preparation
    Cell = db.Cell
    EpochGroup = db.EpochGroup
    EpochBlock = db.EpochBlock
    Epoch = db.Epoch
    Response = db.Response
    Stimulus = db.Stimulus
    Protocol = db.Protocol
    Tags = db.Tags
    table_dict = helpers.utils.table_dict(Experiment, Animal, Preparation, Cell, EpochGroup, 
                                  EpochBlock, Epoch, Response, Stimulus, Tags)

# get table names ordered by hierarchy
def query_levels():
    return table_arr

# get table fields and their types (date/json/string/numeric), list of tuples (field, type)
def table_fields(table_name: str, username: str, db_param: dj.VirtualModule) -> list:
    if not table_dict:
        fill_tables(username, db_param)
    table: dj.Manual = table_dict[table_name] if table_name in table_dict.keys() else None
    if not table:
        return None
    tuples = []
    for field in table.heading.attributes.keys():
        if table.heading.attributes[field].type == 'date':
            tuples.append((field, 'date'))
        elif table.heading.attributes[field].json:
            tuples.append((field, 'json'))
        elif table.heading.attributes[field].string:
            tuples.append((field, 'string'))
        elif table.heading.attributes[field].numeric:
            tuples.append((field, 'numeric'))
        else:
            print(f"Unknown type for field {field}")
            return None
    if table_name in ['epoch_block', 'epoch_group']:
        tuples.append(('protocol_name', 'string'))
    return tuples

# given cond = {type, value}
def process_condition(table_name: str, cond: dict):
    if cond['type'] == 'TAG':
        return (Tags & f'table_name="{table_name}"' & cond['value']).proj(id='table_id')
    else:
        return cond['value']

def apply_conditions(conds: dict, table_name: str) -> list:
    cur_cond = []
    if not conds:
        return cur_cond
    type = list(conds.keys())[0]
    if type == 'COND':
        cur_cond.append(process_condition(table_name, conds['COND']))
        return cur_cond
    for entry in conds[type]:
        cur_cond.extend(apply_conditions(entry, table_name))
    if type == 'AND' or type == 'NOT':
        cur_cond = dj.AndList(cur_cond)
        if type == 'NOT':
            cur_cond = dj.Not(cur_cond)
    return cur_cond

# helper for exec query that actually processes the query object
def process_query(query_obj: dict) -> dj.expression.QueryExpression:
    query = Experiment
    for table in table_arr[:-2]:
        # apply conditions
        if table in query_obj.keys():
            if table in ['epoch_group', 'epoch_block']:
                # add protocol if necessary, rename primary key afterwards
                query = query * table_dict[table] * Protocol.proj(protocol_name = 'name') & apply_conditions(query_obj[table], table)
                query = query.proj(**{f'{table}_protocol_id':'protocol_id'})
            else:
                if table != 'experiment':
                    query = query * table_dict[table]
                if query_obj[table]:
                    query = query & apply_conditions(query_obj[table], table)
        # merge down
        query = query.proj(**{f'{table}_id':'id'}) * table_dict[helpers.utils.child_table(table)].proj(**{f'{table}_id':'parent_id'})
    return query.proj(response_id='id')

# entry method, initializes the database values and then parses query object
def create_query(query_obj: dict, username: str, db_param: dj.VirtualModule) -> dj.expression.QueryExpression:
    global query
    fill_tables(username, db_param)
    if not db:
        return False
    query = process_query(query_obj)
    return query

# once a query has been run, we want to generate a tree to display the results.
# the actual fields can be narrowed down later (in terms of what needs to be displayed), doesn't matter right now.
# format: {object:{...}, children:[{object:{...}, children:[...]}, {object:{...}, children:[...]}, ...]}
def generate_tree(query: dj.expression.QueryExpression, cur_level: int = 0) -> list:
    if cur_level == 7:
        return []
    children = []
    for entry in np.unique(query.fetch(f'{table_arr[cur_level]}_id')):
        child = {}
        child['level'] = table_arr[cur_level]
        child['object'] = (table_dict[table_arr[cur_level]] & f"id={entry}"
                           ).fetch(as_dict=True) if table_arr[cur_level] != 'epoch_group' and table_arr[cur_level] != 'epoch_block' else (
                               (table_dict[table_arr[cur_level]] & f"id={entry}") * Protocol.proj(protocol_name = 'name')).fetch(as_dict=True)
        child['tags'] = (Tags & f'table_name="{table_arr[cur_level]}"' & f'table_id={entry}').proj('user', 'tag').fetch(as_dict=True)
        child['children'] = generate_tree(query & f"{table_arr[cur_level]}_id={entry}", cur_level + 1)
        children.append(child)
    return children

# results methods: going to keep them here for now for simplicity

def get_device_data(epoch_id: int, experiment_id: int) -> dict:
    h5_file, is_mea = (Experiment & f'id={experiment_id}').fetch1('data_file', 'is_mea')
    if is_mea:
        return None
    responses = []
    for item in (Response & f'parent_id={epoch_id}').fetch(as_dict=True):
        responses.append({'device_name': item['device_name'], 'h5_path': item['h5path']})
    stimuli = []
    for item in (Stimulus & f'parent_id={epoch_id}').fetch(as_dict=True):
        stimuli.append({'device_name': item['device_name'], 'h5_path': item['h5path']})
    return {'responses': responses, 'stimuli': stimuli, 'h5_file': h5_file}

def get_image_binary(h5_file: str, h5_path: str) -> bytes:
    with h5py.File(h5_file, 'r') as f:
        fig = Figure()
        ax = fig.subplots()
        ax.plot(f[h5_path]['data']['quantity'])
        buf = BytesIO()
        fig.savefig(buf, format='png')
        data = base64.b64encode(buf.getbuffer()).decode("ascii")
    return data

def add_tags(ids: list, tag: str):
    rows = []
    for id in ids:
        experiment_id, table_name, table_id = id.split('-')
        rows.append({'h5_uuid': (table_dict[table_name] & f"id={table_id}").fetch1()['h5_uuid'],
                     'experiment_id': experiment_id,
                     'table_name': table_name,
                     'table_id': table_id,
                     'user': user,
                     'tag': tag})
    print("Tags table:")
    Tags.insert(rows)
    print(Tags.fetch(), flush=True)

def delete_tags(ids: list, tag: str):
    for id in ids:
        experiment_id, table_name, table_id = id.split('-')
        (Tags & f"experiment_id='{experiment_id}'" & f"table_name='{table_name}'" & f"table_id={table_id}" 
         & f"tag='{tag}'").delete(safemode=False)
    print("Tags table:")
    print(Tags.fetch(), flush=True)