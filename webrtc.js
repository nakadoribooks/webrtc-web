/**
 * @param {onIceCandidate, onLocalStream, onAddedStream} callbacks 
 */
let Webrtc = function(callbacks){
    this.callbacks = callbacks
    this.setupPeerConnection()
    this.setupStream()
}

Webrtc.config = {
    IceUrl: "stun:stun.l.google.com:19302"
}

Webrtc.prototype = {

    // interface ------

    createOffer: function(callback){
        this.peerConnection.createOffer((descriptin) => { 
            this.peerConnection.setLocalDescription(descriptin);
            callback(descriptin)
        }, (error) => {
            
        });
    }

    , receiveAnswer: function(sdp){
        this.peerConnection.setRemoteDescription(sdp).then(()=>{

        })
    }

    , receiveOffer: function(sdp, createdAnswer){

        this.peerConnection.setRemoteDescription(sdp).then(()=>{
            this.peerConnection.createAnswer().then((answerSdp) => {
                this.peerConnection.setLocalDescription(answerSdp)

                createdAnswer(answerSdp)
            })
        })
    }

    , receiveCandidate: function(candidate){
        this.peerConnection.addIceCandidate(candidate)
    }

    // implements -------

    , setupPeerConnection: function(){
        let peerConnection = new RTCPeerConnection({iceServers: [{url: Webrtc.config.IceUrl}]});
        this.peerConnection = peerConnection
        peerConnection.onicecandidate = (event) => {

            let candidate = event.candidate
            if (candidate == null) {
                return;
            }
            
            this.callbacks.onIceCandidate(candidate)
        };
        peerConnection.onaddstream = (event) => {
            let stream = event.stream
            if (stream == null){
                return
            }
            this.callbacks.onAddedStream(stream)
        };

        peerConnection.onicegatheringstatechange = () =>{
            switch(peerConnection.iceGatheringState){
                case "complete":
                    this.callbacks.onGacheringComplete()
                break;
            }
        }
    }

    , setupStream: function(){

        navigator.mediaDevices.getUserMedia({ audio: true, video: true })
        .then((stream) => { 
            this.stream = stream
            this.peerConnection.addStream(this.stream)
            this.callbacks.onLocalStream(stream)
        })
        .catch((err) => { 
            console.error(err)
        });
    }
}