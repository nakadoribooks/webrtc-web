class Webrtc{

    static get config(){
        return {
            IceUrl: "stun:stun.l.google.com:19302"
        }
    }

    static setup(callback){
        navigator.mediaDevices.getUserMedia({ audio: true, video: true })
        .then((stream) => { 
            Webrtc.stream = stream
            callback(stream)
        })
    }

    constructor(callbacks){
        this.callbacks = callbacks
        this.setupPeerConnection()
    }

    // interface -------------------

    createOffer(){
        this.peerConnection.createOffer().then((descriptin) => { 
            this.peerConnection.setLocalDescription(descriptin);
            this.callbacks.onCreateOffer(descriptin);
        }).catch((error)=>{
            console.error(error)
        });
    }

    receiveAnswer(sdp){
        this.peerConnection.setRemoteDescription(sdp).then(()=>{

        }).catch((error)=>{
            console.error(error)
        })
    }

    receiveOffer(sdp){
        this.peerConnection.setRemoteDescription(sdp).then(()=>{
            this.peerConnection.createAnswer().then((answerSdp) => {
                this.peerConnection.setLocalDescription(answerSdp)
                this.callbacks.onCreateAnswer(answerSdp)
            })
        })
    }

    receiveCandidate(candidate){
        this.peerConnection.addIceCandidate(candidate)
    }

    close(){
        this.peerConnection.removeStream(Webrtc.stream)
        this.peerConnection.close()
        this.peerConnection = null;
        this.callbacks = null;
    }

    // implements -----------------------

    setupPeerConnection(){
        let peerConnection = new RTCPeerConnection({iceServers: [{url: Webrtc.config.IceUrl}]});
        this.peerConnection = peerConnection

        this.peerConnection.addStream(Webrtc.stream)
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
        peerConnection.onremovestream = (event) => {
            // TODO 呼ばれない？？
            console.log("onremovestream")
            console.log(event)
        }
    }
}