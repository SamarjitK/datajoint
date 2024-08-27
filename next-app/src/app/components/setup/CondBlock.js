import React, { Component } from 'react';
import axios from 'axios';

import { Alert, Snackbar, CircularProgress} from '@mui/material';

class CondBlock extends Component {
    constructor(props) {
    super(props);
    this.state = {
        error: null,
        response: null,
        open: false,
        table_name: null,
        fields: null,
        tag_fields: null,
        cond_type: "PARAM",
        field_index: null,
        subfield_name: null,
        subfield_type: null,
        type_set: false,
        value: null,
        unsaved_changes: false,
    };
    }

    getFields = () => {
    axios.post('http://localhost:3000/api/query/get-table-fields', { table_name: this.props.table_name })
        .then(response => {
        this.setState({ fields: response.data.fields });
        this.getTagFields();
        })
        .catch(error => {
        // Handle error by setting the error message in the state
            this.setState({ error: error.response.data.message, response: null, open: true});
        });
    }

    getTagFields = () => {
        axios.post('http://localhost:3000/api/query/get-table-fields', { table_name: "tags" })
        .then(response => {
            this.setState({ tag_fields: response.data.fields });
        })
        .catch(error => {
        // Handle error by setting the error message in the state
            this.setState({ error: error.response.data.message, response: null, open: true});
        });
    }

    handleCondTypeChange = (event) => {
        this.setState({ cond_type: event.target.value });
        this.setState({ unsaved_changes: true });
    }

    handleFieldChange = (event) => {
        this.setState({ field_index: event.target.value });
        if (this.state.cond_type == "PARAM" && this.state.fields[event.target.value][1] == "json") {
            this.setState({ type_set: false });
        } else {
            this.setState({ subfield_type: null, subfield_name: null });
            this.setState({ type_set: true });
        }
        this.setState({ unsaved_changes: true });
    }

    handleSubfieldChange = (event) => {
        this.setState({ subfield_name: event.target.value });
        this.setState({ unsaved_changes: true });
    }

    handleSubfieldTypeChange = (event) => {
        this.setState({ subfield_type: event.target.value });
        this.setState({ type_set: true });
        this.setState({ unsaved_changes: true });
    }

    handleOperatorChange = (event) => {
        this.setState({ operator: event.target.value });
        this.setState({ unsaved_changes: true });
    }

    handleValueChange = (event) => {
        this.setState({ value: event.target.value });
        this.setState({ unsaved_changes: true });
    }

    sendUp = () => {
        if (this.state.field_index && this.state.operator && this.state.value) {
            // Need to construct value. First, adding the parameter: if it is a json field, formatted slightly different.
            let condition = "";
            if (this.state.cond_type == "PARAM" && this.state.fields[this.state.field_index][1] == "json") {
                condition = this.state.fields[this.state.field_index][0] + "->>'$."
                            + this.state.subfield_name + "'";
            } else {
                condition = this.state.fields[this.state.field_index][0];
            }
            // Adding the operator and value
            condition += this.state.operator;
            if ((this.state.subfield_type && this.state.subfield_type == "string") 
                || (this.state.fields[this.state.field_index][1] == "string")) {
                condition += "'" + this.state.value + "'";
            } else {
                condition += this.state.value;
            }
            this.setState({ unsaved_changes: false });
            this.props.onQueryChange({ "COND": { "type": this.state.cond_type, "value": condition } }, this.props.table_name);
        }
    }

    componentDidMount() {
        this.getFields();
    }
    
    handleClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        this.setState({ open: false });
    }

    render() {
    const { error, response, open, fields, tag_fields, cond_type, 
        field_index, subfield_type, type_set, unsaved_changes} = this.state;
    const operators = [["=", "equal to"], ["!=", "not equal to"], ["<", "less than"], 
    [">", "greater than"], ["<=", "less than or equal to"], [">=", "greater than or equal to"]];

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
            {fields ? <div> Choose field:
                <select onChange={this.handleCondTypeChange} defaultValue={""}>
                    <option value="" disabled hidden>Select ...</option>
                    <option value="PARAM">PARAM</option>
                    <option value="TAG">TAG</option>
                </select>
                <select onChange={this.handleFieldChange} defaultValue={""}>
                    <option value="" disabled hidden>Select ...</option>
                    <optgroup label="standard">
                        { cond_type == "PARAM" ?
                            fields.map((field, index) => (
                                field[1] != "json" && <option key={index} value={index}>{field[0]} | {field[1]}</option>
                            ))
                            :
                            tag_fields.map((field, index) => (
                                field[1] != "json" && <option key={index} value={index}>{field[0]} | {field[1]}</option>
                            ))
                        }
                    </optgroup>
                    <optgroup label="json">
                        { cond_type == "PARAM" ?
                            fields.map((field, index) => (
                                field[1] == "json" && <option key={index} value={index}>{field[0]} | {field[1]}</option>
                            ))
                            :
                            tag_fields.map((field, index) => (
                                field[1] == "json" && <option key={index} value={index}>{field[0]} | {field[1]}</option>
                            ))
                        }
                    </optgroup>
                </select>
                { field_index && cond_type == "PARAM" && fields[field_index][1] == "json" &&
                <div>
                Subfield:
                <input type="text" placeholder="json key" onChange={this.handleSubfieldChange} />
                <select onChange={this.handleSubfieldTypeChange} defaultValue={""}>
                    <option value="" disabled hidden>Select ...</option>
                    <option value="string">string</option>
                    <option value="number">numeric</option>
                </select>
                </div>
                }
                { type_set && 
                <div> Compare to:
                    <select onChange={this.handleOperatorChange} defaultValue={""}>
                        <option value="" disabled hidden>Select ...</option>
                    { (subfield_type && subfield_type == "string") || (fields[field_index][1] == "string") &&
                        <>
                        <option value=" like ">like</option>
                        <option value=" not like ">not like</option></>
                    }
                        {
                        operators.map((operator, index) => (
                            <option key={index} value={operator[0]}>{operator[1]}</option>
                        ))
                        }
                    </select>
                    <input type="text" placeholder="value" onChange={this.handleValueChange} />
                </div>
                }
            </div>
            :
            <p>Loading ... </p>}
            <button onClick={this.props.onDelete}>Delete</button>
            {this.state.field_index && this.state.operator && this.state.value &&
            <button onClick={this.sendUp}>Save</button>
            }
            {this.state.field_index && this.state.operator && this.state.value && unsaved_changes && 
            "Unsaved changes"}
        </div>
        {/* {isLoading ? <CircularProgress /> : null} */}
        </div>
    );
    }
}

export default CondBlock;
