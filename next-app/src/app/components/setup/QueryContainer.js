import React, { Component } from 'react';
import axios from 'axios';

import AddIcon from '@mui/icons-material/Add';
import { Alert, Snackbar, CircularProgress, 
    Accordion, AccordionSummary, AccordionDetails} from '@mui/material';
import { Modal, Box } from '@mui/material';
import ReactJson from '@microlink/react-json-view';

import LogicBlock from './LogicBlock';

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
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
        open: false,
        query_obj: {},
        modalOpen: false
    };
    }

    getLevels = () => {
    axios.get('http://localhost:3000/api/query/get-query-levels')
        .then(response => {
        // Handle success by setting the data in the state
        this.setState({ levels: response.data.levels });
        })
        .catch(error => {
        // Handle error by setting the error message in the state
            this.setState({ error: error.response.data.message, response: null, open: true});
        });
    }

    componentDidMount() {
        this.getLevels();
    }
    
    handleClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        this.setState({ open: false });
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
        this.props.onQueryObj(temp_obj);
    }

    handleModalOpen = () => {
        this.setState({ modalOpen: true });
    }

    handleModalClose = () => {
        this.setState({ modalOpen: false });
    }


    render() {
    const { error, response, open, levels, modalOpen } = this.state;

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
        <ReactJson src={this.state.query_obj} />
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
                {level}
            </AccordionSummary>
            <AccordionDetails>
                <LogicBlock key={level} table_name={level} onQueryChange={this.handleQueryChange} />
            </AccordionDetails>
            </Accordion>
        ))}
        <button onClick={this.handleModalOpen}>Peek at QueryObj</button>
        {/* {isLoading ? <CircularProgress /> : null} */}
    </div> : <p>Loading...</p>}
        </div>
    );
    }
}

export default QueryContainer;
