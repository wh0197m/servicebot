import React from 'react';
import Load from '../utilities/load.jsx';
import {browserHistory} from 'react-router';
import {Authorizer, isAuthorized} from "../utilities/authorizer.jsx";
import Jumbotron from "../layouts/jumbotron.jsx";
import Content from "../layouts/content.jsx";
import cookie from 'react-cookie';
import DashboardWidget from "../elements/my-services/dashboard-widget.jsx";
import DashboardServiceList from "../elements/my-services/dashboard-service-list.jsx";
import Fetcher from '../utilities/fetcher.jsx';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import _ from "lodash";
import ModalInvoice from '../elements/modals/modal-invoice.jsx';

class MyServices extends React.Component {

    constructor(props){
        super(props);
        let uid = cookie.load("uid");
        let username = cookie.load("username");
        this.state = {  services: [], url: `/api/v1/service-instances/own`,
            nextInvoice: false, invoiceUrl: `/api/v1/invoices/upcoming/${uid}`,
            uid: uid,
            email: username,
            loading:true, invoiceModal: false};
        this.handleComponentUpdating = this.handleComponentUpdating.bind(this);
        this.fetchServiceInstances = this.fetchServiceInstances.bind(this);
        this.fetchNextInvoice = this.fetchNextInvoice.bind(this);
        this.onOpenInvoiceModal = this.onOpenInvoiceModal.bind(this);
        this.onCloseInvoiceModal = this.onCloseInvoiceModal.bind(this);
    }

    componentDidMount(){
        if(!isAuthorized({})){
            return browserHistory.push("/login");
        }
        this.fetchServiceInstances();

    }

    fetchServiceInstances(){
        let self = this;
        Fetcher(self.state.url).then(function(response){
            if(response != null){
                if(!response.error){
                    self.setState({services : response});
                    self.fetchNextInvoice()
                }
            }
            self.setState({loading: false});
        })
    }
    fetchNextInvoice(){
        let self = this;
        Fetcher(self.state.invoiceUrl).then(function(response){
            if(!response.error){
                self.setState({nextInvoice : response});
            }
            self.setState({loading:false});
        })
    }

    handleComponentUpdating(){
        this.fetchServiceInstances()
    }


    onOpenInvoiceModal(){
        this.setState({InvoiceModal: true});
    }
    onCloseInvoiceModal(){
        this.setState({InvoiceModal: false});
    }

    render () {
        let self = this;
        let pageName = self.props.route.name;
        let breadcrumbs = [{name:'Home', link:'home'},{name:'My Services', link:null}];

        if(self.state.loading){
            return (
                <div className="page-dashboard">
                    <Jumbotron pageName={pageName} location={this.props.location}/>
                    <Content>
                        <ReactCSSTransitionGroup component='div' transitionName={'fade'}
                                                 transitionAppear={true} transitionAppearTimeout={1000}
                                                 transitionEnterTimeout={1000} transitionLeaveTimeout={1000}>
                            <Load/>
                        </ReactCSSTransitionGroup>
                    </Content>
                </div>
            );
        }else{

            let allServices = self.state.services;
            let grouped = _.groupBy(allServices, 'status');
            let runningServiceCount = grouped.running ? grouped.running.length : false;
            let requestedServiceCount = grouped.requested ? grouped.requested.length : false;
            let nextInvoiceAmountDue = self.state.nextInvoice ? self.state.nextInvoice.amount_due : 0;

            const currentModal = ()=> {
                if(self.state.InvoiceModal){
                    return(
                        <ModalInvoice show={self.state.InvoiceModal} hide={self.onCloseInvoiceModal}/>
                    );
                }
            };

            return(
                <Authorizer>
                    <div className="page-dashboard">
                        <Jumbotron pageName={pageName} location={this.props.location}/>
                        <Content>
                            <ReactCSSTransitionGroup component='div' transitionName={'fade'}
                                                     transitionAppear={true} transitionAppearTimeout={1000}
                                                     transitionEnterTimeout={1000} transitionLeaveTimeout={1000}>
                                <div className="row m-b-20">
                                    <DashboardWidget widgetIcon="connectdevelop" widgetName="Active Services" widgetData={runningServiceCount || '0'} widgetColor="blue"/>
                                    <DashboardWidget widgetIcon="warning" widgetName="Awaiting for Approvals" widgetData={requestedServiceCount || '0'} widgetColor="blue"/>
                                    <DashboardWidget widgetIcon="credit-card" widgetName="Upcoming Invoice" widgetData={`$${nextInvoiceAmountDue || '0'}`} widgetColor="blue" clickAction={self.onOpenInvoiceModal}/>
                                    <DashboardWidget widgetIcon="check" widgetName="Account Status" widgetData="Good standing" widgetColor="green"/>
                                </div>
                                <div className="row">
                                    <DashboardServiceList handleComponentUpdating={self.handleComponentUpdating} services={self.state.services}/>
                                </div>
                                <div className="row">
                                    {self.props.children}
                                </div>
                            </ReactCSSTransitionGroup>
                        </Content>
                        <ReactCSSTransitionGroup component={'div'} transitionName={'fade'}
                                                 transitionAppear={true} transitionEnter={true} transitionLeave={true}
                                                 transitionAppearTimeout={1000} transitionEnterTimeout={1000} transitionLeaveTimeout={1000}>
                            {currentModal()}
                        </ReactCSSTransitionGroup>
                    </div>
                </Authorizer>
            );
        }
    }
}

export default MyServices;
