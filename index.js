import { strictEqual } from 'node:assert'
import { Buffer } from 'node:buffer'
import { Readable } from 'node:stream'
import ffmpeg from 'fluent-ffmpeg'
import { StreamInput } from '@dank074/fluent-ffmpeg-multistream-ts'

// Example audio file, from https://commons.wikimedia.org/wiki/File:1_California_Inbound_Route_Announcement.wav; 3.7 seconds long
const fetchResponse = await fetch('https://upload.wikimedia.org/wikipedia/commons/7/7f/1_California_Inbound_Route_Announcement.wav')
const input = Buffer.from(await fetchResponse.arrayBuffer())

const output = await new Promise((resolve, reject) => {
  /** @type {Buffer[]} */
  const chunks = []

  const stream = Readable.from(input)
  const socketUrl = StreamInput(stream).url

  ffmpeg()
    // Change the following line to `.input(stream)` to fix the bug
    .input(socketUrl)
    .inputFormat('wav')
    .audioCodec('copy')
    .format('wav')
    .addOption('-hide_banner')
    .on('start', console.log)
    .on('error', reject)
    .on('stderr', console.error)
    .on('end', () => {
      const buffer = Buffer.concat(chunks)
      resolve(buffer)
    })
    .pipe()
    .on('data', chunk => chunks.push(chunk))
})

// These should be equal; they are when using `.input(stream)` above instead of `.input(socketUrl)`
strictEqual(input.length, output.length, `${input.length - output.length} bytes missing`) // 65,536
