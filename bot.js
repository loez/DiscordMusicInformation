const Discord = require("discord.js");
const client = new Discord.Client();
const request = require("request");
const configuracao = require("./config.json")
const ytdl = require('ytdl-core');

const options = {
    url: 'https://api.deezer.com/user/'+ configuracao.DeezerUser +'/history&access_token='+ configuracao.DeezerToken+'&expires=0'
};

function RetornaMusica(musicaAtual) {
    console.log(musicaAtual);
    const canal = client.channels.cache.get(configuracao.CanalID);
    const Embed = new Discord.MessageEmbed()
        .setColor('#0099ff')
        .setTitle(musicaAtual.titulo)
        .setDescription(musicaAtual.artista)
        .setURL(musicaAtual.link)
        .setImage(musicaAtual.capa);

    client.user.setActivity(musicaAtual.nomeArtista, {type: "LISTENING"})
        .then(() => {
            if (configuracao.SendMensagem) {
                canal.send(Embed);
            }

        })
    }

    setTimeout(async function (){
        const audioplay = await client.channels.cache.get(configuracao.CanalAudio).join();
        audioplay.play(ytdl('https://www.youtube.com/watch?v=Nc89e1cj844&list=RDMMH5rwG4qChJ4&index=2&ab_channel=JimmyMix ', { filter: 'audioonly' }),{volume:0.5});
    },10000);

function musicaTime(time) {
    setTimeout(function (){
        musica((musicaAtual) => {
                RetornaMusica(musicaAtual);
                musicaTime(musicaAtual.time * 1000);
            }
        )},time);
}


function musica (callback) {
    request(options,
        function (error, response, body) {
            if (!error && response.statusCode === 200) {
                let json = JSON.parse(body),
                    musica = json["data"][0],
                    arrayRetorno = {
                        'titulo': musica["title"],
                        'artista': musica["artist"]["name"],
                        'capa': musica["album"]["cover_medium"],
                        'link': musica["link"],
                        'nomeArtista': musica["title"] + " - " + musica["artist"]["name"],
                        'time': musica["duration"]
                    };

                callback(arrayRetorno);
            } else {
                callback(null);
            }
        }
    );
}

client.login(configuracao.DiscordToken)
    .then(() => {
        musicaTime(0);

    });