import React from 'react';
import Fetcher from '../../utilities/fetcher.jsx';
import Load from '../../utilities/load.jsx';
import _ from "lodash";
import Dropdown from "./datatable-dropdown.jsx";
import Buttons from "./datatable-button.jsx";

class DataTable extends React.Component {

    //-- Required Props ----------------------------------------------------------------------------------------------------------------------------
    //get(String)       the api url to call
    //** example        "/api/v1/service-instances"

    //col(Array)        tells the recursiveAccess function how to access child Objects returned by the api call by using the dot notation.
    //** example        ['name', 'references.users.0.name', 'subscription_id', 'status', 'requested_by', 'payment_plan.amount', 'payment_plan.interval', 'created']

    //colName(Array)    tells the render function how to render the table headers
    //** example        ['Instance', 'User', 'Subscription ID', 'Status', 'Requested By', 'Amount', 'Interval', 'Created']

    //-- Optional Props ----------------------------------------------------------------------------------------------------------------------------
    //dropdown(Array)   tells the render function how to render the dropdown (support multiple)
    //** example        [{name:'Actions', direction: 'right', buttons:[{id: 1, name: 'Stop', link: '/service-instances/stop'}]
    //** function       you can pass the name and link in each button as function, and return the value you need for the button.
    //** example        dropdown={[{name:'Actions', direction: 'right', buttons:[{id: 3, name: this.dropdownStatus, link: this.dropdownStatusLink}]}]
    //**                this.dropdownStatus and this.dropdownStatusLink are functions defined in your page.

    //buttons(Array)    tells the render function how to render the buttons (support multiple)
    //** example        [{name:'View', link:'/users'},{name:'Edit', link:'/users/edit'}]

    //statusCol(String) Use this prop if you want to use a column as status for the function you pass as button name or link
    //----------------------------------------------------------------------------------------------------------------------------------------------
    constructor(props){
        super(props);
        this.state = { resObjs: [], url: this.props.get, col: this.props.col, colNames: this.props.colNames, loading:true };

        this.fetchData = this.fetchData.bind(this);
        this.handleSort = this.handleSort.bind(this);
        this.handleSearch = this.handleSearch.bind(this);
        this.handleReFetch = this.handleReFetch.bind(this);
    }

    componentDidMount() {
        this.fetchData()
    }

    componentWillReceiveProps(nextProps){
        //this component will update if the calling component(parent component)'s state has changed.
        if(this.props.parentState != nextProps.parentState){
            this.fetchData();
        }
        if(this.props.lastFetch != nextProps.lastFetch){
            this.fetchData();
        }
    }

    fetchData(){
        let self = this;
        let url = self.state.url;
        //todo: Can refactgor to reuse a fetch function as for the search
        Fetcher(url).then(function(response){
            // console.log("response", response);
            if(!response.error){
                self.setState({resObjs : response});
            }
            self.setState({loading:false});
            // console.log(self.state);
        });
    }

    recursiveAccess(accessArray, obj){
        //todo: Need to handle the columns with references object
        let self = this;
        let myAccessArray = new Array(accessArray);
        // console.log("In recurAccess(), reading 1 of: ", accessArray.length, " with key: ", accessArray[0], " from: ", obj);
        if(accessArray.length==1){
            if(obj !== null && obj[accessArray[0]] !== null){
                // console.log("Returning [0]: " + accessArray[0] + ": " + obj[accessArray[0]] + " type: " + typeof(obj[accessArray[0]]));
                let type = typeof(obj[accessArray[0]]);
                if(type == "boolean"){
                    return obj[accessArray[0]] ? "True" : "False";
                }
                return obj[accessArray[0]];
            }
            return "null";
        }else {
            let newObj = obj[accessArray.shift()];
            // console.log("newObj", newObj);
            if(typeof(newObj) != "undefined" && newObj !== null){
                return self.recursiveAccess(accessArray, newObj);
            }else{
                return "null";
            }
        }
    }

    handleSort(column){
        let self = this;
        let array = self.state.resObjs;
        let colString = _.toLower(column.toString());
        colString = _.replace(colString, ' ', '_');
        // console.log("Sorting By: ", colString);
        if(self.state.sortOrder == "desc"){
            let newObjs = _.orderBy(array, [colString], ['asc']);
            self.setState({resObjs: newObjs, sortedBy: column, sortOrder: 'asc'});
        }else{
            let newObjs = _.orderBy(array, [colString], ['desc']);
            self.setState({resObjs: newObjs, sortedBy: column, sortOrder: 'desc'});
        }
    }

    handleSearch(event){
        let self = this;
        const target = event.target;
        const value = target.type === 'checkbox' ? target.checked : target.value;
        let searchURL = `${this.state.url}/search?key=name&value=${value}`;
        // console.log(searchURL);
        self.setState({searchURL: searchURL}, function(){
            self.handleReFetch(self.state.searchURL);
        })
    }

    handleReFetch(url){
        let self = this;
        Fetcher(url).then(function(response){
            // console.log("response", response);
            if(!response.error){
                self.setState({resObjs : response});
            }
            self.setState({loading:false});
            // console.log(self.state);
        });
    }

    render () {
        if(this.state.loading){
            return ( <Load/> );
        }else {
            if(this.state.resObjs.length) {
                return (
                    <div id="tables-datatable" className="table-responsive">
                        <div className="data-table-search">
                            <label>Quick Search: </label>
                            <input className="form-control" onChange={this.handleSearch}/>
                        </div>
                        <table className="table datatable table-striped table-hover">
                            <thead>
                            <tr>
                                { this.state.colNames.map(column => (
                                    <th key={"column-" + column}
                                        onClick={() => this.handleSort(column)}
                                        className={this.state.sortedBy == column && (this.state.sortOrder == "asc" ? 'sorted' : 'sorted desc')}>{column}</th>
                                ))}
                                {/* render the action column if parent passed in an action Object */}
                                { (this.props.dropdown || this.props.buttons) && <th/>}
                            </tr>
                            </thead>
                            <tbody>
                            {this.state.resObjs.map(resObj => (
                                <tr key={"row-" + resObj.id}>
                                    {/*{console.log("The resObj: ", resObj)}*/}
                                    {this.state.col.map(column => (
                                        <td key={`row-${resObj.id}-cell-${column}`}>
                                            {/* dynamic function call from props based on column name,
                                                if column is accessed using a dot, replace the . with a - then call the function*/}
                                            {this.props[`mod_${column.replace(".", "-")}`] ? this.props[`mod_${column.replace(".", "-")}`](this.recursiveAccess(column.split("."), resObj), resObj) :
                                                    this.recursiveAccess(column.split("."), resObj)}
                                        </td>
                                    ))}
                                    {(this.props.dropdown || this.props.buttons) &&
                                    <td>
                                        {this.props.dropdown &&
                                        this.props.dropdown.map(dd => (
                                            <Dropdown key={`dropdown-${resObj.id}-${dd.name}`}
                                                      dataObject={resObj}
                                                      name={dd.name}
                                                      direction={dd.direction}
                                                      dropdown={dd.buttons}
                                                      id={resObj.id}
                                                      active={resObj[this.props.statusCol]}/>
                                        ))
                                        }
                                        {this.props.buttons &&
                                        this.props.buttons.map(b => (
                                            <Buttons key={`button-${b.name}`}
                                                     dataObject={resObj}
                                                     name={b.name}
                                                     link={b.link}
                                                     id={resObj.id}
                                                     active={resObj[this.props.statusCol]}/>
                                        ))
                                        }
                                    </td>
                                    }
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                );
            }else{
                if(this.props.nullMessage){
                    return(
                        <p>{this.props.nullMessage}</p>
                    );
                }else{
                    return(
                        <p>No record in response.</p>
                    );
                }
            }
        }
    }
}

export default DataTable;
