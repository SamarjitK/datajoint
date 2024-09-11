import React, { Component } from 'react';
import axios from 'axios';

import { CircularProgress } from '@mui/material';

class Information extends Component {
    constructor(props) {
    super(props);
    this.state = {
        device_options: null,
        h5_path: null,
        img: null,
        selected: "responses-0",
        id: null,
        epoch_cache: {},
        epoch_queue: [],
        isLoading: false,
        message: null
    };
    }

    fetchImage = (file, path) => {
    this.setState({ isLoading: true });
    axios.post('http://localhost:3000/api/results/get-visualization', {
        h5_file: file,
        h5_path: path
    })
        .then(response => {
        // Handle success by setting the data in the state
        this.setState({ isLoading: false });
        if (response.data.image) {
            this.setState({ img: response.data.image });
            let temp_cache = this.state.epoch_cache;
            temp_cache[this.state.h5_path] = response.data.image;
            this.setState({ epoch_cache: temp_cache });
            let temp_queue = this.state.epoch_queue;
            temp_queue.push(this.state.h5_path);
            this.setState({ epoch_queue: temp_queue });
            if (this.state.epoch_queue.length > 10) {
                let temp_cache = this.state.epoch_cache;
                delete temp_cache[this.state.epoch_queue.shift()];
                this.setState({ epoch_cache: temp_cache });
            }
            this.setState({ message: null });
        } else {
            this.setState({ message: response.data.message });
        }
        })
        .catch(error => {
        this.setState({ isLoading: false });
        // Handle error by sending error message to console
        console.log(error.response.data.message);
        });
    }



    fetchOptions = () => {
    this.setState({ isLoading: true });
    axios.post('http://localhost:3000/api/results/get-visualization-data', {
        level: this.props.level,
        id: this.props.metadata.id,
        experiment_id: this.props.metadata.experiment_id
    })
        .then(response => {
        // Handle success by setting the data in the state
        this.setState({ isLoading: false });
        if (response.data.data != null) {
            let table = this.state.selected.split('-')[0];
            let index = parseInt(this.state.selected.split('-')[1]);
            this.setState({ h5_path: 
                response.data.data[table][index].h5_path })
            this.fetchImage(response.data.data.h5_file, 
                response.data.data[table][index].h5_path)
            this.setState({ device_options: response.data.data });
        } else {
            this.setState({ message: response.data.message });
        }
        })
        .catch(error => {
            this.setState({ isLoading: false });
            // Handle error by sending error message to console
            console.log(error.response.data.message);
        });
    }

    componentDidMount() {
        if (this.props.metadata){
            console.log("mounted, fetching options:")
            this.fetchOptions();
        } else {
            this.setState({ device_options: null });
        }
    }

    handleOptionChange = (event) => {
        this.setState({ selected: event.target.value });
        let table = event.target.value.split('-')[0];
        let index = parseInt(event.target.value.split('-')[1]);
        console.log("option change: " + table + " " + index);
        this.setState({ h5_path: 
            this.state.device_options[table][index].h5_path })
        this.fetchImage(this.state.device_options.h5_file, 
            this.state.device_options[table][index].h5_path);
    }

    componentDidUpdate(prevProps) {
    if (prevProps !== this.props) {
        console.log("updating, fetching options:")
        if (this.props.metadata){
            this.fetchOptions();
        } else {
            this.setState({ device_options: null });
        }
    }
    }

    render() {
    const { img, device_options, selected} = this.state;

    return (
        <div>
        {device_options &&
        <div>
            Select device ({this.props.level} {this.props.metadata.id}):
            <select onChange={this.handleOptionChange} value={selected} defaultValue={"responses-0"}>
            <optgroup label='Responses'>
            {device_options.responses.map((option, index) => (
                <option key={"responses-" + index} 
                        value={"responses-" + index}>{option.device_name}</option>
            ))}
            </optgroup>
            <optgroup label='Stimuli'>
            {device_options.stimuli.map((option, index) => (
                <option key={"stimuli-" + index} 
                        value={"stimuli-" + index}>{option.device_name}</option>
            ))}
            </optgroup>
            </select>
        </div>}
        {!this.state.isLoading && img && 
        <img style = {{ objectFit: 'contain', width: '100%', height: '100%' }}
        src={'data:image/png;base64,' + img} />}
        {this.state.isLoading && <><CircularProgress /><p>Loading from server ...</p></>}
        </div>
    );
    }
}

export default Information;
