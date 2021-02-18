import { static as estatic } from "express";
import express from "express";

import { join } from "path";

import Webpack from "webpack";
import WebpackDevMiddleware from "webpack-dev-middleware";
import { devModeInit } from "./dev";
import { WebsocketServer } from "./websocket/server";
import { packetHandler } from "./websocket/handler";

const webpackConfig = require("../../webpack.config")
const compiler = Webpack(webpackConfig)
const devMiddleWare = WebpackDevMiddleware(compiler, {
    publicPath: webpackConfig.output.publicPath
})

devModeInit()

var app = express()

app.use("/static/script", estatic(join(__dirname, "../../public/dist")))
app.use("/static/style", estatic(join(__dirname, "../../public/css")))
app.use("/static/assets", estatic(join(__dirname, "../../public/assets")))

app.get("/", function (req, res, next) {
    res.sendFile(join(__dirname, "../../public/index.html"))
})

app.use("/js", devMiddleWare)

const ws = new WebsocketServer(5354, packetHandler)

app.use((req, res) => {
    res.status(404)
    res.send("Diese Seite gibt es nicht!")
})

app.listen(5353, () => {
    console.log("\nStarted Server\n")
})
