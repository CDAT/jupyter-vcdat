import * as React from 'react';

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
      return (
        <div className = 'jp-xkcdCartoon'>
          <h1>{this.props.headerText}</h1>
          <img className = '.jp-cartoonImg' src={this.props.src} alt={this.props.alt} title={this.props.title}></img>
          <p>
              {this.props.title}
          </p>
          <div className="jp-xkcdAttribution">
            <a href="https://creativecommons.org/licenses/by-nc/2.5/" className="jp-xkcdAttribution" target="_blank">
              <img src="https://licensebuttons.net/l/by-nc/2.5/80x15.png" />
            </a>
          </div>
        </div>
      )
    }
  }

export default Test;