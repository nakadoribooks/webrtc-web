class Connection {

  constructor(myId, targetId, wamp, callbacks) {
    this.myId = myId
    this.targetId = targetId
    this.wamp = wamp
    this.callbacks = callbacks

    // webrtc
    this.webrtc = new Webrtc({
        onCreateOffer: (sdp) => {
          let str = JSON.stringify(sdp)
          this.wamp.publishOffer(this.targetId, str);
        }
        , onCreateAnswer: (sdp) => {
          let str = JSON.stringify(sdp)
          this.wamp.publishAnswer(this.targetId, str)
        }
        , onIceCandidate: (candidate) => {
          setTimeout(()=>{
             let str = JSON.stringify(candidate)
             this.wamp.publishCandidate(this.targetId, str);
          }, 500)
        }
        , onAddedStream: (stream) => {
          this._remoteStream = stream
          this.callbacks.onAddedStream()
        }
        , onRemoveStream: (stream) =>{
          console.log("onRemoveStream")
        }
    })
  }

  // interface --------------------

  get remoteStream(){
    return this._remoteStream
  }

  publishOffer(){
    this.webrtc.createOffer()
  }

  receiveOffer(sdp){
    this.webrtc.receiveOffer(sdp)
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