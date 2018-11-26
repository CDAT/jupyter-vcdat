import * as React from 'react';
import * as $ from 'jquery';

import { Button } from 'reactstrap';

const rightBtnStyle: React.CSSProperties = {
    float: 'right',
    margin: '5px'
};

type PlotMenuProps = {
    plotAction: any         // the event to trigger the plotting action
}

type PlotMenuState = {}

export class PlotMenu extends React.Component<PlotMenuProps, PlotMenuState> {
    constructor(props: PlotMenuProps){
        super(props);
    }

    render(){
        return (
            <Button type="button" 
                    color="primary" 
                    style={rightBtnStyle} 
                    onClick={this.props.plotAction}>
                Plot
            </Button>
        )
    }
}

export default PlotMenu;