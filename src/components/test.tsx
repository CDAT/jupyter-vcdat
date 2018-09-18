import * as React from 'react';

class Test extends React.Component <any, any> {

    constructor (props: any){
      super(props);
      this.state = { 
        src: this.props.imgSrc.bind(this),
        alt: this.props.imgAlt.bind(this),
        title: this.props.imgTitle.bind(this),
        test: this.props.test
      };
    }
  
    render() {
      return (
        <div>
          <p>This finally worked!! This is rendered by React: {this.props.test}</p>
          <img src={this.state.src} alt={this.state.alt} title={this.state.title}></img>
        </div>
      )
    }
  }

export default Test;