import React, { Component } from 'react';
import axios from 'axios';

import { CircularProgress } from '@mui/material';

class Information extends Component {
    constructor(props) {
    super(props);
    this.state = {
        img: null,
        epoch_cache: {},
        epoch_queue: [],
        isLoading: false,
        message: null
    };
    }

    fetchImage = () => {
    this.setState({ isLoading: true });
    axios.post('http://localhost:3000/api/results/get-visualization', {
        level: this.props.level,
        id: this.props.metadata.id,
        experiment_id: this.props.metadata.experiment_id
    })
        .then(response => {
        // Handle success by setting the data in the state
        this.setState({ isLoading: false });
        if (response.data.image) {
            console.log("received response")
            this.setState({ img: response.data.image });
            let temp_cache = this.state.epoch_cache;
            temp_cache[this.props.metadata.id] = response.data.image;
            this.setState({ epoch_cache: temp_cache });
            let temp_queue = this.state.epoch_queue;
            temp_queue.push(this.props.metadata.id);
            this.setState({ epoch_queue: temp_queue });
            if (this.state.epoch_queue.length > 10) {
                let temp_cache = this.state.epoch_cache;
                delete temp_cache[this.state.epoch_queue.shift()];
                this.setState({ epoch_cache: temp_cache });
            }
            console.log("finished setting up")
            console.log(this.state.epoch_queue);
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

    componentDidMount() {
        if (this.props.metadata){
            this.fetchImage();
        } else {
            this.setState({ img: null });
        }
        // this.fetchImage();
    }

    componentDidUpdate(prevProps) {
    if (prevProps !== this.props) {
        if (this.props.metadata.id in this.state.epoch_cache) {
            this.setState({ img: this.state.epoch_cache[this.props.metadata.id] });
            console.log('Cache hit');
            let temp_queue = this.state.epoch_queue;
            temp_queue.push(this.props.metadata.id);
            this.setState({ epoch_queue: temp_queue, message: null });
        } else {
            this.fetchImage();
        }
    }
    }

    render() {
    const { img } = this.state;

    return (
        <div>
        {this.state.isLoading && <><CircularProgress /><p>Loading from server ...</p></>}
        {!this.state.isLoading && !img && this.state.message && <p>{this.state.message}</p>}
        {!this.state.isLoading && img &&
            <div>
            <p>Trace for Epoch: {this.props.metadata.id}</p>
            <img style = {{ objectFit: 'contain', width: '100%', height: '100%' }}
            src={'data:image/png;base64,' + img} />
            </div>
        }
        </div>
    );
    }
}

export default Information;
