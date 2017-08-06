class Wamp{

    static get config(){
        return {
            HandshakeEndpint: "wss://nakadoribooks-webrtc.herokuapp.com"
            , Topic: {
                Callme: "com.nakadoribook.webrtc.callme"
                , Close: "com.nakadoribook.webrtc.close"
                , Answer: "com.nakadoribook.webrtc.[id].answer"
                , Offer: "com.nakadoribook.webrtc.[id].offer"
                , Candidate: "com.nakadoribook.webrtc.[id].candidate"
            }
        }
    }

    static setup(userId, callbacks){
        Wamp.userId = userId
        Wamp.callbacks = callbacks
    }

    static connect(){

        let connection = new autobahn.Connection({
            url: Wamp.config.HandshakeEndpint
        });
        connection.onopen = (session, details) => { Wamp.onOpen(session, details) }
        connection.onclose = (reason, details) => { Wamp.onClose(session, details) }
        connection.open()

        Wamp.connection = connection
    }

    static endpointAnswer(targetId){
        return Wamp.config.Topic.Answer.replace("[id]", targetId)
    }

    static endpointOffer(targetId){
        return Wamp.config.Topic.Offer.replace("[id]", targetId)
    }

    static endpointCandidate(targetId){
        return Wamp.config.Topic.Candidate.replace("[id]", targetId)
    }

    static endpointCallme(){
        return Wamp.config.Topic.Callme
    }

    static endpointClose(){
        return Wamp.config.Topic.Close
    }

    static onOpen(session, details){

        Wamp.session = session

        // subscribe        
        session.subscribe(Wamp.endpointAnswer(Wamp.userId), (args, kwArgs)=>{ Wamp.onReceiveAnswer(args, kwArgs) });
        session.subscribe(Wamp.endpointOffer(Wamp.userId), (args, kwArgs)=>{ Wamp.onReceiveOffer(args, kwArgs) });
        session.subscribe(Wamp.endpointCallme(), (args, kwArgs)=>{ Wamp.onReceiveCallme(args, kwArgs) });
        session.subscribe(Wamp.endpointClose(), (args, kwArgs)=>{ Wamp.onCloseConnection(args, kwArgs) });

        Wamp.callbacks.onOpen()
    }

    static onReceiveCallme(args, kwArgs){
        let targetId = args[0]

        if(targetId == this.userId){
            return
        }

        Wamp.callbacks.onReceiveCallme(targetId)
    }

    static onReceiveAnswer(args, kwArgs){

        let targetId = args[0]
        let sdp = JSON.parse(args[1])
        Wamp.callbacks.onReceiveAnswer(targetId, sdp)
    }

    static onReceiveOffer(args, kwArgs){
        let targetId = args[0]
        let sdp = JSON.parse(args[1])
        Wamp.callbacks.onReceiveOffer(targetId, sdp)
    }

    static onCloseConnection(args, kwArgs){
        let targetId = args[0]
        if (targetId == this.userId){
            return;
        }
        Wamp.callbacks.onCloseConnection(targetId)
    }

    static onClose(reason, details){
        console.log("onClose")
        console.log(reason)
    }
}
