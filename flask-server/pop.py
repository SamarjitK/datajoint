import datajoint as dj
import json
import os
import datetime

Experiment: dj.Manual = None
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
user: str = None

def fill_tables():
    if not db:
        print("ERROR")
        return
    global Experiment, Preparation, Cell, EpochGroup, EpochBlock, Epoch, Response, Stimulus, Protocol, Tags
    Experiment = db.Experiment
    Preparation = db.Preparation
    Cell = db.Cell
    EpochGroup = db.EpochGroup
    EpochBlock = db.EpochBlock
    Epoch = db.Epoch
    Response = db.Response
    Stimulus = db.Stimulus
    Protocol = db.Protocol
    Tags = db.Tags

def max_id(table: dj.Manual) -> int:
    return dj.U().aggr(table, max=f'max(id)').fetch1('max')

# database populator methods
def append_protocol(protocol_name: str) -> int:
    if not (Protocol & f"name='{protocol_name}'"):
        Protocol.insert1({
            'name': protocol_name
        })
    return (Protocol & f"name='{protocol_name}'").fetch1()['protocol_id']

def append_tags(h5_uuid: str, experiment_id: int, table_name: str, table_id: int, user: str, tags_dict: dict):
    if tags_dict and h5_uuid in tags_dict.keys():
        if 'tags' in tags_dict[h5_uuid].keys() and user in tags_dict[h5_uuid]['tags'].keys():
            Tags.insert1({
                'h5_uuid': h5_uuid,
                'experiment_id': experiment_id,
                'table_name': table_name,
                'table_id': table_id,
                'user': user,
                'tag': tags_dict[h5_uuid]['tags'][user]
            })
        return tags_dict[h5_uuid]
    return None

def append_response(epoch_id: int, device_name: str, response: dict):
    Response.insert1({
        'h5_uuid': response['uuid'],
        'parent_id': epoch_id,
        'device_name': device_name,
        'h5path': response['h5path']
    })

def append_stimulus(epoch_id: int, device_name: str, stimulus: dict):
    Stimulus.insert1({
        'h5_uuid': stimulus['uuid'],
        'parent_id': epoch_id,
        'device_name': device_name,
        'h5path': stimulus['h5path']
    })

def append_epoch(experiment_id: int, parent_id: int, epoch: dict, user: str, tags: dict):
    Epoch.insert1({
        'h5_uuid': epoch['attributes']['uuid'],
        'experiment_id': experiment_id,
        'parent_id': parent_id,
    })
    epoch_id = max_id(Epoch)
    append_tags(epoch['attributes']['uuid'], experiment_id, 'epoch', epoch_id, user, tags)
    for device_name in epoch['responses'].keys():
        append_response(epoch_id, device_name, epoch['responses'][device_name])
    for device_name in epoch['stimuli'].keys():
        append_stimulus(epoch_id, device_name, epoch['stimuli'][device_name])

def append_epoch_block(experiment_id: int, parent_id: int, epoch_block: dict, user: str, tags: dict):
    EpochBlock.insert1({
        'h5_uuid': epoch_block['attributes']['uuid'],
        'experiment_id': experiment_id,
        'parent_id': parent_id,
        'protocol_id': append_protocol(epoch_block['protocolID'])
    })
    epoch_block_id = max_id(EpochBlock)
    tags = append_tags(epoch_block['attributes']['uuid'], experiment_id, 'epoch_block', epoch_block_id, user, tags)
    for epoch in epoch_block['epoch']:
        append_epoch(experiment_id, epoch_block_id, epoch, user, tags)

def append_epoch_group(experiment_id: int, parent_id: int, epoch_group: dict, user: str, tags: dict):
    # first, check if every block has the same protocol_id
    single_protocol = True
    prev_protocol = None
    for epoch_block in epoch_group['block']:
        if prev_protocol == None:
            prev_protocol = epoch_block['protocolID']
        elif prev_protocol != epoch_block['protocolID']:
            single_protocol = False
            break
        else:
            prev_protocol = epoch_block['protocolID']
    
    group_tuple = {'h5_uuid':epoch_group['attributes']['uuid'],
                   'experiment_id': experiment_id,
                   'parent_id': parent_id,
                   'label': epoch_group['label']}

    if single_protocol and epoch_group['block']:
        group_tuple['protocol_id'] = append_protocol(epoch_group['block'][0]['protocolID'])

    EpochGroup.insert1(group_tuple)

    epoch_group_id = max_id(EpochGroup)
    tags = append_tags(epoch_group['attributes']['uuid'], experiment_id, 'epoch_group', epoch_group_id, user, tags)
    for epoch_block in epoch_group['block']:
        append_epoch_block(experiment_id, epoch_group_id, epoch_block, user, tags)

def append_cell(experiment_id: int, parent_id: int, cell: dict, user: str, tags: dict):
    Cell.insert1({
        'h5_uuid': cell['uuid'],
        'experiment_id': experiment_id,
        'parent_id': parent_id,
        'label': cell['label']
    })
    cell_id = max_id(Cell)
    tags = append_tags(cell['uuid'], experiment_id, 'cell', cell_id, user, tags)
    for epoch_group in cell['epoch_groups']:
        append_epoch_group(experiment_id, cell_id, epoch_group, user, tags)

def append_preparation(experiment_id: int, parent_id: int, preparation: dict, user:str, tags: dict):
    Preparation.insert1({
        'h5_uuid': preparation['uuid'],
        'experiment_id': experiment_id,
        'parent_id': parent_id,
        'label': preparation['label']
    })
    preparation_id = max_id(Preparation)
    tags = append_tags(preparation['uuid'], experiment_id, 'preparation', preparation_id, user, tags)
    for cell in preparation['cells']:
        append_cell(experiment_id, preparation_id, cell, user, tags)

def append_experiment(meta: str, data: str, tags: str, meta_dict: dict, user: str, tags_dict: dict):
    Experiment.insert1({
        'h5_uuid': meta_dict['uuid'],
        'meta_file': meta,
        'data_file': data,
        'tags_file': tags,
        'date_added': datetime.datetime.now().date(),
        'label': meta_dict['label']
    })
    experiment_id = max_id(Experiment)
    tags_dict = append_tags(meta_dict['uuid'], experiment_id, 'experiment', experiment_id, user, tags_dict)
    for preparation in meta_dict['preparations']:
        append_preparation(experiment_id, experiment_id, preparation, user, tags_dict)

# dummy method for now, will implement later.
# If there are files to parse, throws error for now.
def parse_data(source: str, dest: str):
    if source.endswith('.h5'):
        print("going to implement this eventually")

def gen_tags(source: str, dest: str):
    if source.endswith('.h5'):
        print("going to implement this eventually")

# returns a list of [meta_file, data_file, tag_file] tuples in the directory
def gen_meta_list(data_dir: str, meta_dir: str, tags_dir: str) -> list:
    stack = [data_dir]
    meta_list = []

    while stack:
        current_dir = stack.pop()
        for item in os.listdir(current_dir):
            full_path = os.path.join(current_dir, item)
            if os.path.isdir(full_path):
                stack.append(full_path)
            else:
                if item.endswith('.h5'):
                    # check for meta
                    meta_file = os.path.join(meta_dir, item[:-3] + '.json')
                    if not os.path.exists(meta_file):
                        parse_data(full_path, meta_dir)
                    # check for tags
                    tags_file = os.path.join(tags_dir, item[:-3] + '.json')
                    if not os.path.exists(tags_file):
                        gen_tags(full_path, tags_dir)
                    meta_list.append([meta_file, full_path, tags_file])
    return meta_list

# entrance method to generate database from a directory
def append_data(data_dir: str, meta_dir: str, tags_dir: str, username: str, db_param: dj.VirtualModule):
    global db
    global user
    db = db_param
    user = username
    fill_tables()

    meta_list = gen_meta_list(data_dir, meta_dir, tags_dir)
    records_added = 0
    for meta, data, tags in meta_list:
        # check if meta and data already in database
        if len(Experiment & f'meta_file="{meta}"' & f'data_file="{data}"' & f'tags_file="{tags}"') == 1:
            continue
        # not in database, add to database
        with open(meta, 'r') as f:
            meta_dict = json.load(f)
        with open(tags, 'r') as f:
            tags_dict = json.load(f)
        append_experiment(meta, data, tags, meta_dict, user, tags_dict)
        records_added += 1
    return records_added
