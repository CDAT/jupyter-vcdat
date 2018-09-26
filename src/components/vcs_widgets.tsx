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
      /*
      this.box = {
        "g_name": "Gfb", "boxfill_type": "linear", "color_1": 0, "color_2": 255, "colormap": null, "datawc_calendar": 135441, "datawc_timeunits": "days since 2000", "datawc_x1": 1e+20, "datawc_x2": 1e+20, "datawc_y1": 1e+20, "datawc_y2": 1e+20, "ext_1": false, "ext_2": false, "fillareacolors": null, "fillareaindices": [1], "fillareaopacity": [], "fillareapixelscale": null, "fillareapixelspacing": null, "fillareastyle": "solid", "legend": null, "level_1": 1e+20, "level_2": 1e+20, "levels": [1e+20, 1e+20], "missing": [0.0, 0.0, 0.0, 100.0], "name": "__boxfill_117978341755590", "projection": "linear", "xaxisconvert": "linear", "xmtics1": {}, "xmtics2": {}, "xticlabels1": {}, 
        "xticlabels2": {}, "yaxisconvert": "linear", 
        "ymtics1": {}, "ymtics2": {}, "yticlabels1": {}, "yticlabels2": {}
      };
      */
      let gm:any = {
        g_name: "Gfb", boxfill_type: "linear", color_1: 0, color_2: 255, colormap: null, 
        datawc_calendar: 135441, datawc_timeunits: "days since 2000", datawc_x1: 1e+20, datawc_x2: 1e+20,
        datawc_y1: 1e+20, datawc_y2: 1e+20, ext_1: false, ext_2: false, fillareacolors: null, fillareaindices: [1],
        fillareaopacity: [], fillareapixelscale: null, fillareapixelspacing: null, fillareastyle: "solid", 
        legend: null, level_1: 1e+20, level_2: 1e+20, levels: [1e+20, 1e+20], missing: [0.0, 0.0, 0.0, 100.0],
        name: "__boxfill_117978341755590", projection: "linear", xaxisconvert: "linear",
        xmtics1: {}, xmtics2: {}, xticlabels1: {}, 
        xticlabels2: {}, yaxisconvert: "linear", 
        ymtics1: {}, ymtics2: {}, yticlabels1: {}, yticlabels2: {}};
      let gms:any = {};
      gms[gm.g_name] = {};
      gms[gm.g_name][gm.name] = gm;


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
        inline: true,
        gm: gm,
        gms: gms
      };
    }
  
    render() {
      var NumField = vcs_widgets.GMEdit;
      return (
        <div className = 'numberField'>
          <h2>This is a GMEdit widget imported from vcs-widgets!</h2>
          <NumField 
         graphicsMethod={this.state.gm.name}
         graphicsMethodParent={this.state.gm.g_name}
         gmProps={this.state.gm}
         graphicsMethods={this.state.gms}
         updateGraphicsMethod={function() {}}
         updateActiveGM={function() {}}
         colormaps={["AMIP", "NCAR", "bl_to_darkred", "bl_to_drkorang", "blends"]}
              />
        </div>
      )
    }
  }

export default VCDAT_Widgets;