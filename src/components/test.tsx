import * as React from 'react';
import vcs_widgets from 'vcs-widgets';

class Test extends React.Component <any, any> {

    constructor (props: any){
      super(props);
      this.state = { 
        src: this.props.imgSrc,
        alt: this.props.imgAlt,
        title: this.props.imgTitle,
        width: this.props.width,
        headerText: this.props.headerText
      };
    }
  
    render() {

      var NumberField = vcs_widgets.NumberField;
      return (
        <div className = 'jp-xkcdCartoon'>
          <h2>This is a NumberField widget imported from vcs-widgets!</h2>
          <NumberField 
                value={15}
                minValue={0}
                maxValue={100}
                updatedValue={()=>{console.log("updated value!");}}
                label="The values are hard coded. This is a label: "
                controlId="numFieldTest"
                step={5}
                autoround={true}
                placeholder={"Value must be <= 100."}
                exponential={false}
                inline={true}
              />
          {/* Commented out the xkcd comic.
          <h2>{this.props.headerText}</h2>
          <img className = '.jp-cartoonImg' src={this.props.src} alt={this.props.alt} title={this.props.title}></img>
          <p>
              {this.props.title}
          </p>
          <div className="jp-xkcdAttribution">
            <a href="https://creativecommons.org/licenses/by-nc/2.5/" className="jp-xkcdAttribution" target="_blank">
              <img src="https://licensebuttons.net/l/by-nc/2.5/80x15.png" />
            </a>
          </div>
          */}
        </div>
      )
    }
  }

export default Test;