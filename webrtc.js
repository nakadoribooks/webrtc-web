class Webrtc{

    static get config(){
        return {
            IceUrl: "stun:stun.l.google.com:19302"
        }
    }

    static setup(){
        return new Promise(function(resolve, reject) {
            navigator.mediaDevices.getUserMedia({ audio: true, video: true })
            .then((stream) => { 
                Webrtc.stream = stream
                resolve(stream)
            })
        });
    }

    constructor(callbacks){
        this.callbacks = callbacks
        this.setupPeerConnection()
    }

    createOffer(callback){
        let self = this
        return new Promise(function(resolve, reject) {
            self.peerConnection.createOffer().then((descriptin) => { 
                self.peerConnection.setLocalDescription(descriptin);
                resolve(descriptin)
            }).catch((error)=>{
                console.error(error)
            });
        })
    }

    receiveAnswer(sdp){
        this.peerConnection.setRemoteDescription(sdp).then(()=>{

        }).catch((error)=>{
            console.error(error)
        })
    }

    receiveOffer(sdp){
        let self = this
        return new Promise(function(resolve, reject) {
            self.peerConnection.setRemoteDescription(sdp).then(()=>{
                self.peerConnection.createAnswer().then((answerSdp) => {
                    self.peerConnection.setLocalDescription(answerSdp)
                    resolve(answerSdp)
                })
            })
        })
    }

    receiveCandidate(candidate){
        this.peerConnection.addIceCandidate(candidate)
    }

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

    close(){
        this.peerConnection.removeStream(Webrtc.stream)
        this.peerConnection.close()
        this.peerConnection = null;
        this.callbacks = null;
    }
}