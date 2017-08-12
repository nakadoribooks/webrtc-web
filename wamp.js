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

    constructor(roomId, userId, callbacks){
        this.roomId = roomId
        this.userId = userId
        this.callbacks = callbacks
    }

    connect(){

        let connection = new autobahn.Connection({
            url: Wamp.config.HandshakeEndpint
        });
        connection.onopen = (session, details) => { this.onOpen(session, details) }
        connection.onclose = (reason, details) => { this.onClose(session, details) }
        connection.open()

        this.connection = connection
    }

    roomTopic(base){
        return base.replace("[roomId]", this.roomId)
    }

    answerTopic(userId){
        return this.roomTopic(Wamp.config.Topic.Answer).replace("[userId]", userId)
    }

    offerTopic(userId){
        return this.roomTopic(Wamp.config.Topic.Offer).replace("[userId]", userId)
    }

    candidateTopic(userId){
        return this.roomTopic(Wamp.config.Topic.Candidate).replace("[userId]", userId)
    }

    callmeTopic(){
        return this.roomTopic(Wamp.config.Topic.Callme)
    }

    closeTopic(){
        return this.roomTopic(Wamp.config.Topic.Close)
    }

    onOpen(session, details){

        this.session = session

        // subscribe        
        session.subscribe(this.answerTopic(this.userId), (args, kwArgs)=>{ this.onReceiveAnswer(args, kwArgs) });
        session.subscribe(this.offerTopic(this.userId), (args, kwArgs)=>{ this.onReceiveOffer(args, kwArgs) });
        session.subscribe(this.candidateTopic(this.userId), (args, kwArgs)=>{ this.onReceiveCandidate(args, kwArgs) });
        session.subscribe(this.callmeTopic(), (args, kwArgs)=>{ this.onReceiveCallme(args, kwArgs) });
        session.subscribe(this.closeTopic(), (args, kwArgs)=>{ this.onCloseConnection(args, kwArgs) });

        this.callbacks.onOpen()
    }

    onReceiveCallme(args, kwArgs){
        let targetId = args[0]

        if(targetId == this.userId){
            return
        }

        this.callbacks.onReceiveCallme(targetId)
    }

    onReceiveAnswer(args, kwArgs){
        let targetId = args[0]
        let sdp = JSON.parse(args[1])
        this.callbacks.onReceiveAnswer(targetId, sdp)
    }

    onReceiveOffer(args, kwArgs){
        let targetId = args[0]
        let sdp = JSON.parse(args[1])
        this.callbacks.onReceiveOffer(targetId, sdp)
    }

    onReceiveCandidate(args, kwArgs){
        let targetId = args[0];
        let candidate = JSON.parse(args[1])
        this.callbacks.onReceiveCandidate(targetId, candidate)
    }

    onCloseConnection(args, kwArgs){
        let targetId = args[0]
        if (targetId == this.userId){
            return;
        }
        this.callbacks.onCloseConnection(targetId)
    }

    onClose(reason, details){
        console.log("onClose")
        console.log(reason)
    }
}
