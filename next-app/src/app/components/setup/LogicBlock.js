import React, { Component } from 'react';
import axios from 'axios';

import { Alert, Snackbar, CircularProgress} from '@mui/material';
import CondBlock from './CondBlock';

class LogicBlock extends Component {
    constructor(props) {
    super(props);
    this.state = {
        error: null,
        response: null,
        open: false,
        table_name: null,
        logic_op: "all",
        criteria_list: []
    };
    }

    // getFields = () => {
    // axios.post('http://localhost:3000/api/query/get-table-fields', { table_name: this.props.table_name })
    //     .then(response => {
    //     // Handle success by setting the data in the state
    //     console.log(response.data.fields);
    //     console.log(this.props.table_name);
    //     this.setState({ fields: response.data.fields });
    //     })
    //     .catch(error => {
    //     // Handle error by setting the error message in the state
    //         this.setState({ error: error.response.data.message, response: null, open: true});
    //     });
    // }

    componentDidMount() {
        // this.getFields();
    }
    
    handleClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        this.setState({ open: false });
    }

    handleAddLogic = () => {
        this.setState({ criteria_list: [...this.state.criteria_list, { "AND": [] }] });
    }

    handleAddCond = () => {
        this.setState({ criteria_list: [...this.state.criteria_list, { "COND": {} }] });
    }

    handleLogicChange = (event) => {
        this.setState({ logic_op: event.target.value });
        // make event.target.value the key of the dictionary
        this.sendUp(event.target.value, this.state.criteria_list);
    }

    sendUp = (logic_op, criteria_list) => {
        // if criteria_list is empty, send up an empty dictionary
        if (criteria_list.length === 0) {
            this.props.onQueryChange({}, this.props.table_name);
        } else if (logic_op === "all") {
            this.props.onQueryChange({ "AND": criteria_list }, this.props.table_name);
        } else if (logic_op === "any") {
            this.props.onQueryChange({ "OR": criteria_list }, this.props.table_name);
        } else {
            this.props.onQueryChange({ "NOT": criteria_list }, this.props.table_name);
        }
    }

    render() {
    const { error, response, open, logic_op, criteria_list} = this.state;

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

        <div style={{ border: "lightgrey solid 1px" }}>
        {/* Dropdown to choose between all/any/none of these are true */}
        {/* store this in state */}
        <select value={logic_op} onChange={this.handleLogicChange}>
            <option value="all">All</option>
            <option value="any">Any</option>
            <option value="none">None</option>
        </select>
        &nbsp; of these are true:
        <div style = {{marginLeft : "2%"}}>
        {
        criteria_list.map((criteria, index) => {
            const handleQueryChange = (query, table_name) => {
                const updatedCriteriaList = [
                    ...this.state.criteria_list.slice(0, index),
                    query,
                    ...this.state.criteria_list.slice(index + 1)
                ];
                this.setState({ criteria_list: updatedCriteriaList });
                this.sendUp(logic_op, updatedCriteriaList);
            };

            const handleDelete = () => {
                const updatedCriteriaList = [
                    ...this.state.criteria_list.slice(0, index),
                    ...this.state.criteria_list.slice(index + 1)
                ];
                this.setState({ criteria_list: updatedCriteriaList });
                this.sendUp(logic_op, updatedCriteriaList);
            };

            return (
                <div key={index}>
                    {Object.keys(criteria)[0] !== "COND" ?
                        <LogicBlock
                            key={index}
                            table_name={this.props.table_name}
                            onDelete={handleDelete}
                            onQueryChange={handleQueryChange}
                        />
                        :
                        <CondBlock
                            key={index}
                            table_name={this.props.table_name}
                            onDelete={handleDelete}
                            onQueryChange={handleQueryChange}
                        />
                    }
                </div>
            );
        })}
        </div>
        <div> 
            <button onClick={this.handleAddLogic}>Add logical block</button>
            <button onClick={this.handleAddCond}>Add condition</button>
            <button onClick={this.props.onDelete}>Delete</button>
        </div>
        {/* {isLoading ? <CircularProgress /> : null} */}
        </div>
        </div>
    );
    }
}

export default LogicBlock;
