console.log("hjkh");

let currentAudio = null;
let currentlyPlayingLi = null;
let songs = []; // Store songs array globally
let currentSongIndex = -1; // Track current song index

async function getsongs() {
    let a = await fetch("http://localhost:5500/playlist");
    let response = await a.text();

    let div = document.createElement("div");
    div.innerHTML = response;

    let as = div.getElementsByTagName("a");
    let songList = [];

    for (let index = 0; index < as.length; index++) {
        const element = as[index];
        if (element.href.endsWith(".mp3")) {
            let filename = element.getAttribute("href").split('/').pop();
            songList.push('playlist/' + filename);
        }
    }

    return songList;
}

function playTrack(index) {
    if (index < 0 || index >= songs.length) return;

    const song = songs[index];
    const songLis = document.querySelectorAll(".songList li");
    const li = songLis[index];

    // Stop current audio and reset UI
    if (currentAudio) {
        currentAudio.pause();
        if (currentlyPlayingLi) {
            currentlyPlayingLi.classList.remove("playing");
            currentlyPlayingLi.querySelector(".playnow span").innerText = "Play";
            currentlyPlayingLi.querySelector(".play-icon").src = "img/play-black.svg";
        }
    }

    // Create and play new audio
    currentAudio = new Audio(song);
    const volumeSlider = document.getElementById("volumebar");
    currentAudio.volume = parseFloat(volumeSlider.value);
    currentAudio.play();

    // Update UI
    currentlyPlayingLi = li;
    currentSongIndex = index;
    li.classList.add("playing");
    li.querySelector(".playnow span").innerText = "Pause";
    li.querySelector(".play-icon").src = "img/pause.svg";
    document.getElementById("play").src = "img/pause.svg";

    // Update song info
    let filename = song.split('/').pop();
    let cleanName = decodeURIComponent(filename).replace(/\.mp3$/i, "");
    document.querySelector(".songinfo").innerText = cleanName;

    // Add event listeners for new audio
    setupAudioEventListeners();
}

function setupAudioEventListeners() {
    if (!currentAudio) return;

    const songTime = document.querySelector(".songtime");
    const circle = document.querySelector(".circle");
    const playBtn = document.getElementById("play");
    const songInfo = document.querySelector(".songinfo");

    currentAudio.addEventListener("timeupdate", () => {
        let current = currentAudio.currentTime;
        let duration = currentAudio.duration;
        let progress = (current / duration) * 100;
        circle.style.left = `${progress}%`;
        songTime.innerText = `${formatTime(current)} / ${formatTime(duration)}`;
    });

    currentAudio.addEventListener("ended", () => {
        // Auto-play next song
        playNext();
    });
}

function playNext() {
    if (currentSongIndex < songs.length - 1) {
        playTrack(currentSongIndex + 1);
    } else {
        // End of playlist - stop playing
        stopPlayback();
    }
}

function playPrevious() {
    if (currentSongIndex > 0) {
        playTrack(currentSongIndex - 1);
    }
}

function stopPlayback() {
    if (currentAudio) {
        currentAudio.pause();
    }
    if (currentlyPlayingLi) {
        currentlyPlayingLi.classList.remove("playing");
        currentlyPlayingLi.querySelector(".playnow span").innerText = "Play";
        currentlyPlayingLi.querySelector(".play-icon").src = "img/play-black.svg";
    }
    document.getElementById("play").src = "img/play-black.svg";
    document.querySelector(".songinfo").innerText = "";
    document.querySelector(".songtime").innerText = "";
    document.querySelector(".circle").style.left = "0%";
    currentSongIndex = -1;
}

async function main() {
    songs = await getsongs(); // Store globally
    let songUL = document.querySelector(".songList ul");
    songUL.innerHTML = "";

    const songInfo = document.querySelector(".songinfo");
    const songTime = document.querySelector(".songtime");
    const playBtn = document.getElementById("play");
    const seekbar = document.querySelector(".seekbar");
    const circle = document.querySelector(".circle");
    const volumeSlider = document.getElementById("volumebar");

    for (let index = 0; index < songs.length; index++) {
        const song = songs[index];
        let filename = song.split('/').pop();
        let cleanName = decodeURIComponent(filename).replace(/\.mp3$/i, "");

        let li = document.createElement("li");
        li.innerHTML = `
            <img class="invert" width="34" src="img/music.svg" alt="">
            <div class="info">
                <div>${cleanName}</div>
                <div>Linkin Park</div>
            </div>
            <div class="playnow">
                <span>Play</span>
                <img class="invert play-icon" src="img/play-black.svg" alt="">
            </div>
        `;

        li.addEventListener("click", () => {
            const liPlayText = li.querySelector(".playnow span");
            const liPlayIcon = li.querySelector(".playnow .play-icon");

            if (currentAudio && currentlyPlayingLi === li) {
                if (currentAudio.paused) {
                    currentAudio.play();
                    liPlayText.innerText = "Pause";
                    liPlayIcon.src = "img/pause.svg";
                    playBtn.src = "img/pause.svg";
                } else {
                    currentAudio.pause();
                    liPlayText.innerText = "Play";
                    liPlayIcon.src = "img/play-black.svg";
                    playBtn.src = "img/play-black.svg";
                }
                return;
            }

            // Play the selected track
            playTrack(index);
        });

        songUL.appendChild(li);
    }
}

function formatTime(seconds) {
    if (isNaN(seconds)) return "00:00";
    let min = Math.floor(seconds / 60);
    let sec = Math.floor(seconds % 60);
    return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

// Playbar toggle
document.getElementById("play").addEventListener("click", () => {
    if (currentAudio) {
        const liPlayText = currentlyPlayingLi?.querySelector(".playnow span");
        const liPlayIcon = currentlyPlayingLi?.querySelector(".playnow .play-icon");

        if (currentAudio.paused) {
            currentAudio.play();
            document.getElementById("play").src = "img/pause.svg";
            if (liPlayText) liPlayText.innerText = "Pause";
            if (liPlayIcon) liPlayIcon.src = "img/pause.svg";
        } else {
            currentAudio.pause();
            document.getElementById("play").src = "img/play-black.svg";
            if (liPlayText) liPlayText.innerText = "Play";
            if (liPlayIcon) liPlayIcon.src = "img/play-black.svg";
        }
    }
});

// Previous button
document.getElementById("previous").addEventListener("click", () => {
    playPrevious();
});

// Next button
document.getElementById("next").addEventListener("click", () => {
    playNext();
});

// Seekbar
document.querySelector(".seekbar").addEventListener("click", (e) => {
    if (!currentAudio) return;
    const bar = e.currentTarget;
    const rect = bar.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const percentage = offsetX / rect.width;
    currentAudio.currentTime = percentage * currentAudio.duration;
});

// Volume control
document.getElementById("volumebar").addEventListener("input", (e) => {
    const volume = parseFloat(e.target.value);
    if (currentAudio) {
        currentAudio.volume = volume;
    }
});

main();