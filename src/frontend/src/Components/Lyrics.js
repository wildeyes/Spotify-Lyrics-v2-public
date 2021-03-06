import React, { Component } from "react";
import Button from '@material-ui/core/Button';

import "../Styles/Lyrics.css"

import LoadingList from "../Classes/LoadingList";

class Lyrics extends Component {
    constructor(props) {
        super(props);
        this.state = {
            action: props.action,
            token: props.token,
            artist: "",
            song: "",
            lyrics: "",
            loading: false,
            loadingDisplay: ""
        }

        this.loadingList = LoadingList;
        this.timeout = null;
        this.controller = new AbortController();
    }

    componentDidMount() {
        this.loadData(this)
        this.timeout = setInterval(this.loadData, 5000, this);
      }

    componentWillUnmount() {
        this.setState({token:null})
        this.controller.abort();
        clearTimeout(this.timeout);
    }

    async loadData(_this) {
        const url = "https://api.spotify.com/v1/me/player";
        try {
            const response = await fetch(url, {
            signal: _this.controller.signal,
              method: 'GET', // or 'PUT'// data can be `string` or {object}!
              headers: {
                'Content-Type': 'application/json',
                "Authorization": "Bearer " + _this.state.token
              }
            });
            try {
                const json = await response.json();
                var artists = [];
                var currSong = json.item.name;
                json.item.artists.forEach(element => {
                    artists.push(element.name);
                });
                var artistsString = artists.join()

                if(currSong !== _this.state.song) {
                    await _this.setState({song: currSong, artist: artistsString});
                    await _this.getLyrics(_this);
                }
            } catch(error) {
                _this.setState({song:"Not Listening", artist:"Nobody", lyrics: "Nope"});
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }

    formatSong(song) {
        song = song.split('-')[0];
        song = song.replace(/[^\w\s]/gi, '');
        song = song.toLowerCase();
        return song;
    }

    async loading(_this) {
        while(_this.state.loading) {
            console.log("loading");
            var load = [];
            load.push(<p className="lyric" key="loading">Getting lyrics{_this.loadingList.data}</p>);
            _this.setState({loadingDisplay:load});
            _this.loadingList = _this.loadingList.next;
            await _this.sleep(500);
        }
        _this.loadingList = LoadingList;
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async getLyrics(_this) {
        const url = process.env.REACT_APP_FUNCTION_URL

        let data = {
            song : _this.formatSong(_this.state.song),
            artist : _this.state.artist
        }

        _this.setState({loading:true});
        _this.loading(_this);
        
        try {
            const response = await fetch(url, {
                signal: _this.controller.signal,
                crossDomain: true,
                method: 'POST',
                body: JSON.stringify(data),
                headers: {
                    'content-type':'application/json',
                    'X-Api-Key': process.env.REACT_APP_API_KEY,
                }
            });
            const json = await response.json();
            _this.setState({loading:false});

            if(response.ok) {
                var split = json.lyrics.split('\n');
                var lyrics = [];
                split.forEach((lyric,i) => {
                    if(lyric === "" || lyric === "\n" ){
                        lyrics.push(<p className="lyric" key={i} ><br /></p>)
                    }
                    else {
                        lyrics.push(<p className="lyric" key={i}>{lyric}</p>);
                    }
                });
                _this.setState({lyrics})
            }
            else {
                throw new Error(); 
            }
        }catch(e) {
            console.log(e);
            _this.setState({loading:false, lyrics:"Error getting lyrics :-0"});
        }
    }

    render() {
        var loaderOrLyrics = this.state.loading 
                            ? this.state.loadingDisplay 
                            : this.state.lyrics
        return (
            <div className="Lyrics">
                <div className="fill">
                    <div className="strip">
                        <h1>Currently Playing: {this.state.song}</h1>
                    </div>
                    <div className="strip">
                        <h3>By: {this.state.artist}</h3>
                    </div>
                    <div className="strip">
                        <h4>Lyrics: </h4>
                        {loaderOrLyrics}
                    </div>
                    <div className="logout">
                        <Button
                                style={{
                                    borderRadius: 35,
                                    backgroundColor: "#808080",
                                    padding: "5px 36px",
                                    fontSize: "12px",
                                    color: "#F5F5F5",
                                    fontFamily: "CircularStd",
                                    alignSelf: "center"
                                }}
                                variant="contained"
                                onClick={this.state.action}
                                >
                                <b>Logout</b>
                        </Button>
                    </div>
                </div>
            </div>
        )
    }
}
export default Lyrics;