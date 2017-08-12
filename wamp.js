class Wamp{

    static get config(){
        return {
            HandshakeEndpint: "wss://nakadoribooks-webrtc.herokuapp.com"
            , Topic: {
                Callme: "com.nakadoribook.webrtc.[roomId].callme"
                , Close: "com.nakadoribook.webrtc.[roomId].close"
                , Answer: "com.nakadoribook.webrtc.[roomId].[userId].answer"
                , Offer: "com.nakadoribook.webrtc.[roomId].[userId].offer"
                , Candidate: "com.nakadoribook.webrtc.[roomId].[userId].candidate"
            }
        }
    }

    static setup(roomId, userId, callbacks){
        Wamp.roomId = roomId
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

    static roomTopic(base){
        return base.replace("[roomId]", Wamp.roomId)
    }

    static endpointAnswer(userId){
        return Wamp.roomTopic(Wamp.config.Topic.Answer).replace("[userId]", userId)
    }

    static endpointOffer(userId){
        return Wamp.roomTopic(Wamp.config.Topic.Offer).replace("[userId]", userId)
    }

    static endpointCandidate(userId){
        return Wamp.roomTopic(Wamp.config.Topic.Candidate).replace("[userId]", userId)
    }

    static endpointCallme(){
        return Wamp.roomTopic(Wamp.config.Topic.Callme)
    }

    static endpointClose(){
        return Wamp.roomTopic(Wamp.config.Topic.Close)
    }

    static onOpen(session, details){

        Wamp.session = session

        // subscribe        
        session.subscribe(Wamp.endpointAnswer(Wamp.userId), (args, kwArgs)=>{ Wamp.onReceiveAnswer(args, kwArgs) });
        session.subscribe(Wamp.endpointOffer(Wamp.userId), (args, kwArgs)=>{ Wamp.onReceiveOffer(args, kwArgs) });
        session.subscribe(Wamp.endpointCandidate(Wamp.userId), (args, kwArgs)=>{ Wamp.onReceiveCandidate(args, kwArgs) });
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

    static onReceiveCandidate(args, kwArgs){
        let targetId = args[0];
        let candidate = JSON.parse(args[1])
        Wamp.callbacks.onReceiveCandidate(targetId, candidate)
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
