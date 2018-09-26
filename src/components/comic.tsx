import { Widget } from '@phosphor/widgets';
import { Message } from '@phosphor/messaging';
import * as React from 'react';
import * as ReactDom from 'react-dom';

/**
 * An xckd comic viewer
 */
class XkcdComic extends Widget {
	/**
	 * Construct a new xkcd widget.
	 */
	constructor(widgetId: string, headerText: any) {
		super();

		this.id = widgetId;
		this.title.label = 'xkcd.com';
		this.headerText = headerText;
		this.title.closable = true;
		this.addClass('jp-xkcdWidget');
		this.div = document.createElement('div');
		this.div.id = "app";
		this.div.className = 'jp-xkcdCartoon';
		this.node.appendChild(this.div);

		ReactDom.render(<Comic 
	headerText={this.headerText} src={this.imgSrc} alt={this.imgAlt} title={this.imgTitle} />, this.div);
	}
	/**
	 * The image element associated with the widget.
	 */

	div: HTMLDivElement;
	imgSrc: any;
	imgAlt: any;
	imgTitle: any;
	headerText: string;

	/**
	 * Handle update requests for the widget.
	 */
	onUpdateRequest(msg: Message): void {
		fetch('https://egszlpbmle.execute-api.us-east-1.amazonaws.com/prod').then(response => {
			return response.json();
		}).then(data => {
			this.imgSrc = data.img;
			this.imgAlt = data.title;
			this.imgTitle = data.alt;

			this.reRender();
		});
	}

	reRender(): void {
		ReactDom.render(<Comic headerText={this.headerText} src={this.imgSrc} alt={this.imgAlt} title={this.imgTitle} />, this.div);
	}
};

class Comic extends React.Component <any, any> {

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
				</div>
			)
		}
	}

export default XkcdComic;