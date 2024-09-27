import React, { Component } from 'react';
import axios from 'axios';

import AddIcon from '@mui/icons-material/Add';
import { Button, Checkbox } from '@blueprintjs/core';
import { Alert, Snackbar, CircularProgress, 
    Accordion, AccordionSummary, AccordionDetails,
    FormGroup} from '@mui/material';
import { Modal, Box } from '@mui/material';
import ReactJson from '@microlink/react-json-view';

import LogicBlock from './LogicBlock';

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 600,
    overflow: 'scroll',
    maxHeight: '80%',
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
  };

class QueryContainer extends Component {
    constructor(props) {
    super(props);
    this.state = {
        error: null,
        response: null,
        levels: null,
        fields: null,
        tag_fields: null,
        open: false,
        query_obj: {},
        final_query: {},
        exclude_levels: [],
        hideExclude: false,
        modalOpen: false
    };
    }

    exclude_obj = {
        "NOT": [{
            "COND": {
                type : "TAG",
                value : "tag='exclude'"
                }
        }]
    }

    getLevelsAndFields = () => {
    axios.get('http://localhost:3000/api/query/get-levels-and-fields')
        .then(response => {
        // Handle success by setting the data in the state
        this.setState({ levels: response.data.levels });
        this.setState({ fields: response.data.fields });
        this.setState({ tag_fields: response.data.tag_fields });
        })
        .catch(error => {
        // Handle error by setting the error message in the state
            this.setState({ error: error.response.data.message, response: null, open: true});
        });
    }

    componentDidMount() {
        this.getLevelsAndFields();
    }
    
    handleClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        this.setState({ open: false });
    }

    handleAfterEffects = (temp_obj, excluded) => {
        if (excluded) {
            if ("epoch" in temp_obj) {
                let inner_obj = temp_obj["epoch"];
                temp_obj["epoch"] = { "AND":
                    [inner_obj, this.exclude_obj]
                 }
            } else {
                temp_obj["epoch"] = this.exclude_obj;
            }
        }
        this.setState({ final_query: temp_obj });
        this.props.onQueryObj(temp_obj);
    }

    handleQueryChange = (query, table_name) => {
        let temp_obj = {};
        if (query == {}) {
            temp_obj = this.state.query_obj;
            delete temp_obj[table_name];
        } else {
            temp_obj = { ...this.state.query_obj, [table_name]: query };
        }
        this.setState({ query_obj: temp_obj });
        this.handleAfterEffects(structuredClone(temp_obj), this.state.hideExclude);
    }

    handleModalOpen = () => {
        this.setState({ modalOpen: true });
    }

    handleModalClose = () => {
        this.setState({ modalOpen: false });
    }

    handleLevelSelect = (event) => {
        if (event.target.checked) {
            if (this.state.exclude_levels.includes(event.target.value)) {
                let temp_list = this.state.exclude_levels.filter(e => e !== event.target.value);
                this.props.onExcludeChange(temp_list);
                this.setState({ exclude_levels: temp_list });
            }
        } else {
            if (!(this.state.exclude_levels.includes(event.target.value))) {
                let temp_list = this.state.exclude_levels;
                temp_list.push(event.target.value);
                this.props.onExcludeChange(temp_list);
                this.setState({ exclude_levels: temp_list });
            }
        }
    }

    handleExcludeClick = () => {
        this.handleAfterEffects(structuredClone(this.state.query_obj), !this.state.hideExclude);
        this.setState({ hideExclude: !this.state.hideExclude});
    }

    render() {
    const { error, response, open, 
        levels, fields, tag_fields, modalOpen, hideExclude } = this.state;

    return (
        <div>
        <Snackbar open={open} autoHideDuration={6000} onClose={this.handleClose}>
            <Alert
            onClose={this.handleClose}
            severity={error != null ? "error" : "success"}
            variant="filled"
            sx={{ width: '100%' }}
            >
            {error != null ? error : response}
            </Alert>
        </Snackbar>

        <Modal
        open={modalOpen}
        onClose={this.handleModalClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
        >
        <Box sx={style}>
        <ReactJson src={this.state.final_query} />
        </Box>
        </Modal>

        {levels != null ? <div style={{ margin: "0%", padding: "0%" }}>
        {levels.map((level, index) => (
            <Accordion key={index} style={{ margin: "0%" }} 
            sx={{'& .MuiAccordionSummary-content': {margin: "2px 0"},
            '& .MuiAccordionSummary-content.Mui-expanded': {margin: "4px 0"},
            '& .MuiAccordionDetails-root': {padding: "1%"},
        }}>
            <AccordionSummary expandIcon={<AddIcon />} style={{ minHeight: "0" }}>
                <Checkbox onChange={this.handleLevelSelect} label={level} value={level} defaultChecked={true} />
            </AccordionSummary>
            <AccordionDetails>
                <LogicBlock key={level} 
                table_name={level}
                fields={fields[level]} 
                tag_fields={tag_fields}
                onQueryChange={this.handleQueryChange} />
            </AccordionDetails>
            </Accordion>
        ))}
        <FormGroup inline={true}>
        <Checkbox
            checked={hideExclude}
            onChange={this.handleExcludeClick}
            label='hide excluded'/>
        <Button onClick={this.handleModalOpen}>Peek at QueryObj</Button>
        </FormGroup>
        {/* {isLoading ? <CircularProgress /> : null} */}
    </div> : <p>Loading...</p>}
        </div>
    );
    }
}

export default QueryContainer;
