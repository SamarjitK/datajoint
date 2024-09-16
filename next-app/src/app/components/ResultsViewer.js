"use client"

import * as React from 'react';
import axios from 'axios';
import ReactJson from '@microlink/react-json-view';
import ResultsTree from './results/ResultsTree';
import Information from './results/Information';
import { Button, AnchorButton } from '@blueprintjs/core';


export default function ResultsViewer(props){
  const [focusedItem, setFocusedItem] = React.useState(null);
  const [level, setLevel] = React.useState(null);

    const results = props.results != null ? props.results : null

    const displayInfo = (metadata, level) => {
        setFocusedItem(metadata);
        setLevel(level);
    }

    return (
    <div style={{ display: 'flex', height: '100%'}}>
        <div style={{ flex: 1}}>
            <div style={{ marginRight: "1%", 
            backgroundColor: "darkgray", borderRadius: "1%", padding: "1%",
            overflowX: "auto", overflowY: "auto", height: '95%' }}>
                {results && <ResultsTree results={results} onFocus={displayInfo} />}
            </div>
            <div style={{ marginRight: "1%", padding: "1%", height: '5%' }}>
                <AnchorButton href={`data:text/json;charset=utf-8,${encodeURIComponent(
              JSON.stringify(results, null, '\t')
            )}`}
            download="results.json">
                Download JSON</AnchorButton>
            </div>
        </div>
        <div style={{ flex: 1, marginLeft: "1%", maxWidth: "48%"}}>
            <div style={{ height: "55%", overflow: "auto",
                borderRadius: "1%", backgroundColor: "darkgrey",
                 margin: "0% 1% 3% 0%" }}>
                {!focusedItem ? <div>Click on a valid item in the tree to view visualizations</div> :
                <Information metadata={focusedItem} level={level} />}
            </div>
            <div style={{ height: "43%", overflow: "auto",
                borderRadius: "1%", backgroundColor: "#1e1e1e", 
                margin: "3% 1% 1% 0%"}}>
                {focusedItem != null && 
                <ReactJson style={{margin: "3%"}} theme={'twilight'} src={focusedItem} collapsed="true" />}
            </div>
        </div>
    </div>
    );
}
