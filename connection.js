class Connection {

  constructor(myId, targetId, callbacks) {
    this.myId = myId
    this.targetId = targetId
    this.callbacks = callbacks

    // webrtc
    this.webrtc = new Webrtc({
        onIceCandidate: (candidate) => {
          setTimeout(()=>{
             this.publishCandidate(candidate)
          }, 500)
        }
        , onAddedStream: (stream) => {
          stream.targetId = this.targetId
          this.callbacks.onAddedStream(stream)
        }
        , onRemoveStream: (stream) =>{
          console.log("onRemoveStream")
        }
    })

    // for tricke ice
    let candidateTopic = Wamp.endpointCandidate(this.myId)
    Wamp.session.subscribe(candidateTopic, (args, kwArgs)=>{ 
      this.onReceiveCandidate(args, kwArgs) 
    });
  }

  publishOffer(){
    this.webrtc.createOffer().then((sdp)=>{
      let str = JSON.stringify(sdp)
      let topic = Wamp.endpointOffer(this.targetId)
      Wamp.session.publish(topic, [this.myId, str]);
    })
  }

  publishAnswer(remoteSdp){
    this.webrtc.receiveOffer(remoteSdp).then((answerSdp) => {
      let str = JSON.stringify(answerSdp)
      let topic = Wamp.endpointAnswer(this.targetId)
      Wamp.session.publish(topic, [this.myId, str]);
    }).catch((error)=>{
      console.error(error)
    })
  }

  publishCandidate(candidate){
      let str = JSON.stringify(candidate)
      let topic = Wamp.endpointCandidate(this.targetId)

      console.log("publishCandidate", topic)
      Wamp.session.publish(topic, [str]);
  }

  receiveAnswer(answerSdp){
    this.webrtc.receiveAnswer(answerSdp)
  }

  onReceiveCandidate(args){
      let candidate = JSON.parse(args[0])
      this.webrtc.receiveCandidate(candidate)
  }

  close(){
    console.log("closeConnection")
    this.callbacks = null
    this.webrtc.close()
  }

}