import * as React from "react";
import Variable from "./Variable";
import DimensionSlider from "./DimensionSlider";
import AxisInfo from "./AxisInfo";

import {
    Card,
    CardTitle,
    CardSubtitle,
    CardBody,
    CardFooter,
    Button,
    Collapse,
    FormGroup,
    Input
} from "reactstrap";

var cardStyle: React.CSSProperties = {
    margin: "1em"
}


type VarCardProps = {
    variable: Variable;
    selectVariable: any, // method to call to add this variable to the list to get loaded
};
type VarCardState = {
    showAxis: boolean;
    loadOrder: number;
    axisState: any;
};

export default class VarCard extends React.Component<VarCardProps, VarCardState>{
    constructor(props: VarCardProps){
        super(props);
        this.state = {
            loadOrder: -1,
            showAxis: false,
            axisState: []
        };

        this.props.variable.axisInfo.forEach(element => {
            
        });

        this.toggleAxis = this.toggleAxis.bind(this);
        this.openMenu = this.openMenu.bind(this);
    }
    render(){
        return (<div>
            <Card style={cardStyle}>
                <CardBody>
                    <CardTitle>
                        {this.props.variable.name}
                    </CardTitle>
                    <CardSubtitle>
                        {this.props.variable.longName}
                    </CardSubtitle>
                    <Collapse isOpen={this.state.showAxis} onClick={this.openMenu}>
                        {/* {this.props.variable.axisInfo.forEach((item: AxisInfo) => {
                            return <DimensionSlider key={item.name} {...item} />
                        })} */}
                        {this.props.variable.axisInfo.forEach((item: any) => {
                            return item.name
                        })}
                    </Collapse>
                </CardBody>
                <CardFooter>
                    <Button onClick={this.props.selectVariable}>
                        Select
                    </Button>
                </CardFooter>
            </Card>
        </div>)
    }
    toggleAxis(){
        this.setState({
            showAxis: !this.state.showAxis
        })
    }
    openMenu(){
        if(!this.state.showAxis){
            this.setState({
                showAxis: true
            });
        }
    }
}