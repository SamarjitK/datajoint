import React, { Component, useEffect } from 'react';
import { RichTreeView } from '@mui/x-tree-view/RichTreeView';
// plus and minus icons for expansion and collapse of tree
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';

import CustomTreeItem from './CustomTreeItem';
import { useTreeViewApiRef } from '@mui/x-tree-view/hooks';

import axios from 'axios';

export default function ResultsTree(props){
    const [items, setItems] = React.useState(null);

    useEffect(() => {
        setItems(updateItems(props.results));
    }, [props.results]);

    const updateItems = (results) => {
        let items = [];
        results.forEach((result) => {
            let object = {};
            object['id'] = result.level + "-"  + result.object[0].id;
            object['level'] = result.level;
            object['metadata'] = result.object[0];
            object['label'] = result.object[0].label ? result.object[0].label : object['id'];
            object['children'] = updateItems(result.children);
            items.push(object);
        });
        return items
    }

    const apiRef = useTreeViewApiRef();

    const handleClick = (event, item) => {
        props.onFocus(apiRef.current.getItem(item).metadata, apiRef.current.getItem(item).level);
    }

    return (
        <div>
            {items != null && <RichTreeView multiSelect checkboxSelection 
            apiRef={apiRef}
            slots={{expandIcon: AddIcon, collapseIcon: RemoveIcon, item: CustomTreeItem}}
            items={items} expansionTrigger="iconContainer"
            onItemClick={handleClick}/>}
        </div>
    );
}
