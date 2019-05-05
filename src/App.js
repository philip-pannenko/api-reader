import React, {Component} from 'react';
import Badge from 'react-bootstrap/Badge';
import ListGroup from 'react-bootstrap/ListGroup';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import Tab from 'react-bootstrap/Tab';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Tabs from 'react-bootstrap/Tabs';
import moment from 'moment'

class App extends Component {

    constructor(props) {
        super(props);
        this.state = {events: []};
    }

    componentDidMount() {
        this.fetchConditions();
    }

    fetchConditions = async () => {
        //https://y1wohv6zb7.execute-api.us-east-1.amazonaws.com/prod/
        try {
            let response = await fetch(`conditions`);
            const json = await response.json();

            let events = json.payload.map((item, i) => {
                let start = moment(item.date).format('ddd, MMM Do - h:mm a');
                return {
                    id: i,
                    start: start,
                    reason: item.reason
                };
            });

            this.setState({events: events});
        } catch (e) {
            console.error(e);
        }
    };

    render() {
        let {events} = this.state;

        return (
            <React.Fragment>

                <Navigation/>

                <div className="px-3 py-3 pt-md-5 pb-md-4 mx-auto text-center">
                    <h1 className="display-4">East Lyme Swimming</h1>
                    <p className="lead">Crazy group of swimmers that enjoy morning at Harkness.</p>
                </div>

                <Tabs defaultActiveKey="home" id="uncontrolled-tab-example">
                    <Tab eventKey="home" title="Upcoming Swims">
                        <ListGroup variant="flush">
                            {events.map((event, i) =>
                                <EventRow key={i} event={event}/>
                            )}
                        </ListGroup>
                    </Tab>
                    <Tab eventKey="profile" title="Members">
                        <ListGroup variant="flush">
                            <ListGroup.Item action onClick={this.handleShow}>
                                Elizabeth Hesser
                            </ListGroup.Item>
                            <ListGroup.Item action onClick={this.handleShow}>
                                Philip Pannneko
                            </ListGroup.Item>
                            <ListGroup.Item action onClick={this.handleShow}>
                                Amanda Pannenko
                            </ListGroup.Item>
                        </ListGroup>
                    </Tab>
                    <Tab eventKey="contact" title="About">
                        <div style={{padding: ".75rem 1.25rem"}}>Our open-water group swims every Tuesday and Thursday
                            weather
                            permitting at 6 am. We meet at Harkness Park in CT at the South end of the beach. We keep a
                            steady tempo.
                        </div>
                    </Tab>
                </Tabs>


            </React.Fragment>
        )

    }
}

const Navigation = props => (
    <Navbar bg="light" expand="lg">
        <Navbar.Brand href="#home">Go Swimming!</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav"/>
        <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="mr-auto">
                <Navbar.Text>
                    Signed in as: Philip Pannenko
                </Navbar.Text>
                <Nav.Link href="#groups">Groups</Nav.Link>
                <Nav.Link href="#profile">Profile</Nav.Link>
                <Nav.Link href="#notifications">Notifications</Nav.Link>
                <Nav.Link href="#logout">Logout</Nav.Link>
            </Nav>
        </Navbar.Collapse>
    </Navbar>
);

const EventModal = ({show, handleClose, event}) => (
    <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
            <Modal.Title>{event.start}</Modal.Title>
        </Modal.Header>
        <Modal.Body>Here are some deets. <p>List of people that are definitely going:</p> <p>Liz, Philip, etc...</p>
        </Modal.Body>
        <Modal.Footer>
            <Button variant="secondary" onClick={handleClose}>
                Close
            </Button>
            <Button variant="primary" onClick={handleClose}>
                I'm Going!
            </Button>
            <Button variant="danger" onClick={handleClose}>
                Unregister
            </Button>
        </Modal.Footer>
    </Modal>
);

class EventRow extends Component {

    constructor(props) {
        super(props);
        this.state = {show: false};
    }

    handleClose = () => {
        debugger;
        this.setState({show: false});
    };

    handleShow = () => {
        debugger;
        this.setState({show: true});
    };

    render() {
        let {event} = this.props;
        let {show} = this.state;
        if (event) {
            debugger;
        }
        return (event ?
                <>
                    <ListGroup.Item action onClick={this.handleShow}>
                        <h5 className="mb-1">{event.start}</h5>

                        {event.reason.map((property, i) =>
                            <Badge key={i} className="mr-1"
                                   variant="primary">{property.display}: {property.value}</Badge>
                        )}

                        <Badge className="mr-1" variant="primary">Going: -- </Badge>
                        <Badge className="mr-1" variant="success">You're Going!</Badge>

                    </ListGroup.Item>
                    <EventModal show={show} event={event} handleClose={this.handleClose}/>
                </> : null
        );
    }
}


export default App;
