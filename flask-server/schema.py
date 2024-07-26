import datajoint as dj

dj.config['database.host'] = '127.0.0.1'
dj.config['database.user'] = 'root'
dj.config['database.password'] = 'simple'

dj.conn().connect()

schema = dj.schema('schema')

@schema
class Protocol(dj.Manual):
    definition = """
    # protocol information
    protocol_id: int auto_increment
    ---
    name: varchar(255)
    """

# central schema: directly from h5 files
# for now going to be mostly empty! just connectors to each other

@schema
class Experiment(dj.Manual):
    definition = """
    # experiment metadata, including pointers to files
    id: int auto_increment
    ---
    h5_uuid: varchar(255)
    meta_file: varchar(255)
    data_file: varchar(255)
    tags_file: varchar(255)
    date_added: date
    label: varchar(255)
    """

@schema
class Preparation(dj.Manual):
    definition = """
    # preparation information
    id: int auto_increment
    ---
    h5_uuid: varchar(255)
    -> Experiment.proj(experiment_id='id')
    -> Experiment.proj(parent_id='id')
    label: varchar(255)
    """

@schema
class Cell(dj.Manual):
    definition = """
    # cell information
    id: int auto_increment
    ---
    h5_uuid: varchar(255)
    -> Experiment.proj(experiment_id='id')
    -> Preparation.proj(parent_id='id')
    label: varchar(255)
    """

@schema
class EpochGroup(dj.Manual):
    definition = """
    # epoch group information
    id: int auto_increment
    ---
    h5_uuid: varchar(255)
    -> Experiment.proj(experiment_id='id')
    -> Cell.proj(parent_id='id')
    -> [nullable] Protocol
    label: varchar(255)
    """

@schema
class EpochBlock(dj.Manual):
    definition = """
    # epoch block information
    id: int auto_increment
    ---
    h5_uuid: varchar(255)
    -> Experiment.proj(experiment_id='id')
    -> EpochGroup.proj(parent_id='id')
    -> Protocol
    """

@schema
class Epoch(dj.Manual):
    definition = """
    # epoch information
    id: int auto_increment
    ---
    h5_uuid: varchar(255)
    -> Experiment.proj(experiment_id='id')
    -> EpochBlock.proj(parent_id='id')
    """

@schema
class Response(dj.Manual):
    definition = """
    # response information
    id: int auto_increment
    ---
    h5_uuid: varchar(255)
    -> Epoch.proj(parent_id='id')
    device_name: varchar(255)
    h5path: varchar(511)
    """

@schema
class Stimulus(dj.Manual):
    definition = """
    # stimulus information
    id: int auto_increment
    ---
    h5_uuid: varchar(255)
    -> Epoch.proj(parent_id='id')
    device_name: varchar(255)
    h5path: varchar(511)
    """

# misc. peripheral schema
@schema
class Tags(dj.Manual):
    definition = """
    # tagging information
    tag_id: int auto_increment
    ---
    h5_uuid: varchar(255) # id of object in h5 file
    -> Experiment.proj(experiment_id='id')
    table_name: varchar(255) # name of table in database
    table_id: int # id of object in database table
    user: varchar(63) # name of profile who made this tag: could be a name or anything else
    tag: varchar(255) # tag: THIS SHOULD CHANGE. For now, comma separated list.
    """