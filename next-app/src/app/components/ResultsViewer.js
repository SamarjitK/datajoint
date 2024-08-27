"use client"

import * as React from 'react';
import axios from 'axios';
import ReactJson from '@microlink/react-json-view';
import ResultsTree from './results/ResultsTree';
import Information from './results/Information';


export default function ResultsViewer(props){
  const [selectedItem, setSelectedItem] = React.useState(null);
  const [level, setLevel] = React.useState(null);

    const results = props.results != null ? props.results : null
    // [
    //     {
    //       "children": [
    //         {
    //           "children": [
    //             {
    //               "children": [
    //                 {
    //                   "children": [
    //                     {
    //                       "children": [],
    //                       "level": "epoch_block",
    //                       "object": [
    //                         {
    //                           "data_file": "20240717C/data000/",
    //                           "experiment_id": 14,
    //                           "h5_uuid": "a8d2386f-d46c-4894-9fa5-1938755074dc",
    //                           "id": 246,
    //                           "parent_id": 181,
    //                           "protocol_id": 86,
    //                           "protocol_name": "manookinlab.protocols.SpatialNoise"
    //                         }
    //                       ],
    //                       "tags": []
    //                     },
    //                     {
    //                       "children": [],
    //                       "level": "epoch_block",
    //                       "object": [
    //                         {
    //                           "data_file": "20240717C/data001/",
    //                           "experiment_id": 14,
    //                           "h5_uuid": "b216e8cd-8179-4b40-88e4-ccfa2580573b",
    //                           "id": 247,
    //                           "parent_id": 181,
    //                           "protocol_id": 86,
    //                           "protocol_name": "manookinlab.protocols.SpatialNoise"
    //                         }
    //                       ],
    //                       "tags": []
    //                     }
    //                   ],
    //                   "level": "epoch_group",
    //                   "object": [
    //                     {
    //                       "experiment_id": 14,
    //                       "h5_uuid": "20a39e47-b041-4cbb-bfb6-0ae0a3297393",
    //                       "id": 181,
    //                       "label": "noise",
    //                       "parent_id": 14,
    //                       "properties": {
    //                         "externalSolutionAdditions": "[]",
    //                         "internalSolutionAdditions": null,
    //                         "pipetteSolution": null,
    //                         "recordingTechnique": null,
    //                         "seriesResistanceCompensation": 0
    //                       },
    //                       "protocol_id": 86,
    //                       "protocol_name": "manookinlab.protocols.SpatialNoise"
    //                     }
    //                   ],
    //                   "tags": []
    //                 },
    //                 {
    //                   "children": [
    //                     {
    //                       "children": [],
    //                       "level": "epoch_block",
    //                       "object": [
    //                         {
    //                           "data_file": "20240717C/data002/",
    //                           "experiment_id": 14,
    //                           "h5_uuid": "087186fe-8397-4a27-ac18-b406279ec427",
    //                           "id": 248,
    //                           "parent_id": 182,
    //                           "protocol_id": 87,
    //                           "protocol_name": "manookinlab.protocols.ContrastResponseGrating"
    //                         }
    //                       ],
    //                       "tags": []
    //                     }
    //                   ],
    //                   "level": "epoch_group",
    //                   "object": [
    //                     {
    //                       "experiment_id": 14,
    //                       "h5_uuid": "056278cf-88d3-4df7-abb6-c8748dc519e8",
    //                       "id": 182,
    //                       "label": "CRF",
    //                       "parent_id": 14,
    //                       "properties": {
    //                         "externalSolutionAdditions": "[]",
    //                         "internalSolutionAdditions": null,
    //                         "pipetteSolution": null,
    //                         "recordingTechnique": null,
    //                         "seriesResistanceCompensation": 0
    //                       },
    //                       "protocol_id": 87,
    //                       "protocol_name": "manookinlab.protocols.ContrastResponseGrating"
    //                     }
    //                   ],
    //                   "tags": []
    //                 },
    //                 {
    //                   "children": [
    //                     {
    //                       "children": [],
    //                       "level": "epoch_block",
    //                       "object": [
    //                         {
    //                           "data_file": "20240717C/data003/",
    //                           "experiment_id": 14,
    //                           "h5_uuid": "3e632252-4523-41a4-81e3-719a17b0bb32",
    //                           "id": 249,
    //                           "parent_id": 183,
    //                           "protocol_id": 88,
    //                           "protocol_name": "manookinlab.protocols.DovesMovie"
    //                         }
    //                       ],
    //                       "tags": []
    //                     }
    //                   ],
    //                   "level": "epoch_group",
    //                   "object": [
    //                     {
    //                       "experiment_id": 14,
    //                       "h5_uuid": "b4fd2565-2c0e-405c-abba-9edbad081e20",
    //                       "id": 183,
    //                       "label": "doves movies",
    //                       "parent_id": 14,
    //                       "properties": {
    //                         "externalSolutionAdditions": "[]",
    //                         "internalSolutionAdditions": null,
    //                         "pipetteSolution": null,
    //                         "recordingTechnique": null,
    //                         "seriesResistanceCompensation": 0
    //                       },
    //                       "protocol_id": 88,
    //                       "protocol_name": "manookinlab.protocols.DovesMovie"
    //                     }
    //                   ],
    //                   "tags": []
    //                 }
    //               ],
    //               "level": "cell",
    //               "object": [
    //                 {
    //                   "experiment_id": 14,
    //                   "h5_uuid": "43a817ff-9994-4a9c-a3b0-f53b4b6e2ff2",
    //                   "id": 14,
    //                   "label": "20240717Cm1",
    //                   "parent_id": 14,
    //                   "properties": {
    //                     "type": "RGC"
    //                   }
    //                 }
    //               ],
    //               "tags": []
    //             }
    //           ],
    //           "level": "preparation",
    //           "object": [
    //             {
    //               "experiment_id": 14,
    //               "h5_uuid": "a929a7b6-5745-4508-bf3a-86f2c196023c",
    //               "id": 14,
    //               "label": "Mount1",
    //               "parent_id": 14,
    //               "properties": {
    //                 "bathSolution": "Ames",
    //                 "preparation": "RPE attached",
    //                 "region": "[\"peripheral\",\"temporal\"]",
    //                 "time": "17-Jul-2024 07:23:57"
    //               }
    //             }
    //           ],
    //           "tags": []
    //         }
    //       ],
    //       "level": "experiment",
    //       "object": [
    //         {
    //           "data_file": "",
    //           "date_added": "Fri, 23 Aug 2024 00:00:00 GMT",
    //           "h5_uuid": "fb983285-9391-41a6-9ffa-70a4cd8073cb",
    //           "id": 14,
    //           "is_mea": 1,
    //           "label": "20240717",
    //           "meta_file": "/Users/samarjit/workspace/neuro/schema_testing/meta/20240717C.json",
    //           "properties": {
    //             "age": "9 yr 2 mo",
    //             "darkAdaptation": "1 hour",
    //             "description": "TDP animal",
    //             "experimenter": "Mike Manookin",
    //             "id": null,
    //             "institution": "UW",
    //             "lab": "Manookin and Rieke Lab",
    //             "project": "mea",
    //             "rig": "C (suction)",
    //             "sex": "male",
    //             "species": "M. mulatta",
    //             "weight": "16.6 kg"
    //           },
    //           "tags_file": "/Users/samarjit/workspace/neuro/schema_testing/tags/20240717C.json"
    //         }
    //       ],
    //       "tags": []
    //     }
    //   ];

    const displayInfo = (metadata, level) => {
        setSelectedItem(metadata);
        setLevel(level);
    }

    return (
    <div style={{ display: 'flex', height: '100%'}}>
        <div style={{ flex: 1, marginRight: "1%", 
            backgroundColor: "darkgray", borderRadius: "1%", padding: "1%",
            overflowX: "auto", overflowY: "auto"}}>
            {results && <ResultsTree results={results} onFocus={displayInfo} />}
        </div>
        <div style={{ flex: 1, marginLeft: "1%", maxWidth: "48%"}}>
            <div style={{ height: "55%", overflow: "auto",
                borderRadius: "1%", backgroundColor: "darkgrey",
                 margin: "0% 1% 3% 0%" }}>
                {!selectedItem ? <div>Click on a valid item in the tree to view visualizations</div> :
                <Information metadata={selectedItem} level={level} />}
            </div>
            <div style={{ height: "43%", overflow: "auto",
                borderRadius: "1%", backgroundColor: "#1e1e1e", 
                margin: "3% 1% 1% 0%"}}>
                {selectedItem != null && 
                <ReactJson style={{margin: "3%"}} theme={'twilight'} src={selectedItem} collapsed="true" />}
            </div>
        </div>
    </div>
    );
}
