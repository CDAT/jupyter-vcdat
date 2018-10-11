import * as React from 'react';
import List from './List';

/**
 * A component to show a list and performs actions for clicked items
 * 
 * props:
 *  listSet: A dictionary of string arrays listing items to show in drop down.
 *  clickAction: Function to perform when a specific item in the inner list is clicked.
 */

const setStyle = {
    margin: '2px 5px',
    fontWeight: 'bold' as 'bold', // Typescript needs this to be cast to 'bold' type or it will complain
    testDecoration: 'none'
}

class ListSet extends React.Component <any,any> {

    constructor(props: any){
        super(props)
        this.state = {
            activeList: null,
            activeItem: null, // Get first item and set as active by default
            show: false
        }
        this.listClickHandler = this.listClickHandler.bind(this);
        this.clickItemHandler = this.clickItemHandler.bind(this);
    }
    
    listClickHandler(event: any, listName: string, itemName: string) {

        if(listName===this.state.activeList){
            this.setState({show: !this.state.show});
        }
        this.setState({
            activeList: listName, 
            activeItem: itemName,
        });
    }

    clickItemHandler(activeList: string, listItem: string){
        this.setState({
            activeItem: listItem, 
            activeList: activeList
        });
        this.props.clickAction(activeList, listItem);
    }

    render() {
        let listNames: Array<string> = Object.keys(this.props.listSet);
        return (<div className='scroll-area'>
            {listNames.map((listName: string, index: number) => {
                return (
                    <ul key={index} className='no-bullets left-list active'>
                        <a href="#" 
                           style={setStyle} 
                           onClick={(event: any) => {
                               this.listClickHandler(event,
                                                     listName,
                                                     this.state.activeItem)}}>
                               {listName}
                        </a>
                        { this.state.show ?
                        <List
                            activeList={this.state.activeList}
                            activeItem={this.state.activeItem}
                            listName={listName}
                            itemList={this.props.listSet[listName]}
                            clickAction={this.clickItemHandler}/>
                        : "" }
                    </ul>
                )
            })}
        </div>);
    }
}

export default ListSet;
