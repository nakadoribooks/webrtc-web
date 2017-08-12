class Connection {

  constructor(myId, targetId, wamp, callbacks) {
    this.myId = myId
    this.targetId = targetId
    this.wamp = wamp
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
  }

  publishOffer(){
    this.webrtc.createOffer().then((sdp)=>{
      let str = JSON.stringify(sdp)
      let topic = this.wamp.offerTopic(this.targetId)
      this.wamp.session.publish(topic, [this.myId, str]);
    })
  }

  publishAnswer(remoteSdp){
    this.webrtc.receiveOffer(remoteSdp).then((answerSdp) => {
      let str = JSON.stringify(answerSdp)
      let topic = this.wamp.answerTopic(this.targetId)
      this.wamp.session.publish(topic, [this.myId, str]);
    }).catch((error)=>{
      console.error(error)
    })
  }

  publishCandidate(candidate){
      let str = JSON.stringify(candidate)
      let topic = this.wamp.candidateTopic(this.targetId)

      console.log("publishCandidate", topic)
      this.wamp.session.publish(topic, [this.myId, str]);
  }

  receiveAnswer(answerSdp){
    this.webrtc.receiveAnswer(answerSdp)
  }

  receiveCandidate(candidate){
    this.webrtc.receiveCandidate(candidate)
  }

  close(){
    console.log("closeConnection")
    this.callbacks = null
    this.webrtc.close()
  }

}