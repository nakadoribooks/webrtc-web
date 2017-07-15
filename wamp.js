let Wamp = function(callbacks){
    this.callbacks = callbacks
}

Wamp.config = {
    HandshakeEndpint: "wss://nakadoribooks-webrtc.herokuapp.com"
    , Topic: {
       Anser: "com.nakadoribook.webrtc.answer"
        , Offer: "com.nakadoribook.webrtc.offer"
        , Candidate: "com.nakadoribook.webrtc.candidate"
    }
}

Wamp.prototype = {

    // interface
    connect: function(){

        let connection = new autobahn.Connection({
            url: Wamp.config.HandshakeEndpint
        });
        connection.onopen = (session, details) => { this.onOpen(session, details) }
        connection.onclose = (reason, details) => { this.onClose(session, details) }
        connection.open()

        this.connection = connection
    }

    , publishOffer: function(sdp){
        let str = JSON.stringify(sdp)
        this.session.publish(Wamp.config.Topic.Offer, [str]);
    }

    , publishAnswer: function(sdp){
        let str = JSON.stringify(sdp)
        this.session.publish(Wamp.config.Topic.Anser, [str]);
    }

    , publishCandidate: function(candidate){
        let str = JSON.stringify(candidate)
        this.session.publish(Wamp.config.Topic.Candidate, [str]);
    }

    // implements
    , onOpen: function(session, details){
        this.session = session

        // subscribe
        session.subscribe(Wamp.config.Topic.Anser, (args, kwArgs)=>{ this.onReceiveAnswer(args, kwArgs) });
        session.subscribe(Wamp.config.Topic.Offer, (args, kwArgs)=>{ this.onReceiveOffer(args, kwArgs) });
        session.subscribe(Wamp.config.Topic.Candidate, (args, kwArgs)=>{ this.onReceiveCandidate(args, kwArgs) });
    },

    onClose: function(reason, details){
        console.log("onClose")
        console.log(reason)
    }
    
    , onReceiveAnswer: function(args){
        let sdp = JSON.parse(args[0])
        this.callbacks.onReceiveAnswer(sdp)
    }

    , onReceiveOffer: function(args){
        let sdp = JSON.parse(args[0])
        this.callbacks.onReceiveOffer(sdp)
    }

    , onReceiveCandidate: function(args){
        let candidate = JSON.parse(args[0])
        this.callbacks.onReceiveCandidate(candidate)
    }
}

