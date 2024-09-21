import datajoint as dj

NAS_DATA_DIR = '/Volumes/data/data/sorted'
NAS_ANALYSIS_DIR = '/Volumes/data/analysis'

def table_dict(Experiment: dj.Manual, Animal: dj.Manual, Preparation: dj.Manual,
               Cell: dj.Manual, EpochGroup: dj.Manual,
               EpochBlock: dj.Manual, Epoch: dj.Manual, 
               Response: dj.Manual, Stimulus: dj.Manual,
               Tags: dj.Manual) -> dict:
    return {
        'experiment': Experiment,
        'animal': Animal,
        'preparation': Preparation,
        'cell': Cell,
        'epoch_group': EpochGroup,
        'epoch_block': EpochBlock,
        'epoch': Epoch,
        'response': Response,
        'stimulus': Stimulus,
        'tags': Tags
    }

table_arr = ['experiment', 'animal', 'preparation', 'cell', 'epoch_group', 'epoch_block', 'epoch', 'response', 'stimulus']

def child_table(table_name: str) -> str:
    return None if table_name == 'response' else table_arr[table_arr.index(table_name) + 1]

def parent_table(table_name: str) -> str:
    return None if table_name == 'experiment' else table_arr[table_arr.index(table_name) - 1]