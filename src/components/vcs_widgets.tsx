import * as React from 'react';
import * as ReactDOM from 'react-dom';
import vcs_widgets from 'vcs-widgets';
import { Widget } from '@phosphor/widgets';

class VCDAT_Widgets extends Widget {
  
  constructor(widgetId: string){
    super();
    this.div = document.createElement('div');
    this.div.id = 'vcs-widget';
    this.node.appendChild(this.div);

    ReactDOM.render(
    <NumberField widgetId={widgetId} />, this.div)
  }
  div: HTMLDivElement;
};

class NumberField extends React.Component <any, any> {

    constructor (props: any){
      super(props);
      this.state = { 
        value: 15,
        minValue: 0,
        maxValue: 100,
        updated: ()=>{console.log("Value updated!")},
        label: "Label Text",
        controlId: this.props.widgetId,
        step: 1,
        autoround: true,
        placeholder: "Value must be <= 100.",
        exponential: false,
        inline: true
      };
    }
  
    render() {

      var NumField = vcs_widgets.NumberField;
      return (
        <div className = 'numberField'>
          <h2>This is a NumberField widget imported from vcs-widgets!</h2>
          <NumField 
                value={this.state.value}
                minValue={this.state.minValue}
                maxValue={this.state.maxValue}
                updatedValue={this.state.updated}
                label={this.state.label}
                controlId={this.props.id}
                step={this.state.step}
                autoround={this.state.autoround}
                placeholder={this.state.placeholder}
                exponential={this.state.exponential}
                inline={this.state.inline}
              />
        </div>
      )
    }
  }

export default VCDAT_Widgets;