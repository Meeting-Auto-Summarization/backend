const spawn = require('child_process').spawn;
var path = require('path');
var fs = require('fs').promises;

exports.generateScriptDocx = (req, res) => {
    const { meeting, script } = req.query;
    const python = spawn('venv/bin/python3.9', ['./python/scriptDocx.py', JSON.stringify(meeting), JSON.stringify(script)]);

    console.log(script)

    python.stdout.on('data', function(result) {
        const filename = `${result.toString().replace(/\n/g, "")}.docx`;  
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`); // 이게 핵심 
        res.setHeader('Content-Type', '"application/octet-stream"');
        res.sendFile(path.join(__dirname, '../', filename), function() {
            fs.unlink(path.join(__dirname, '../', filename), err => {
                if (err) {
                    console.log("Error : ", err)
                }
            });
        });
    });

    python.stderr.on('data', function(data) {
        console.log(data.toString());
        res.send(data.toString());
    });
}

exports.generateReportDocx = (req, res) => {
    const { meeting, report } = req.query;
    const python = spawn('venv/bin/python3.9', ['./python/reportDocx.py', JSON.stringify(meeting), JSON.stringify(report)]);

    python.stdout.on('data', function(result) {
        const filename = `${result.toString().replace(/\n/g, "")}.docx`;  
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`); // 이게 핵심 
        res.setHeader('Content-Type', '"application/octet-stream"');
        res.sendFile(path.join(__dirname, '../', filename), function() {
            fs.unlink(path.join(__dirname, '../', filename), err => {
                if (err) {
                    console.log("Error : ", err)
                }
            });
        });
    });

    python.stderr.on('data', function(data) {
        console.log(data.toString());
        res.send(data.toString());
    });
}

exports.generateScriptTxt = async (req, res) => {
    const { meeting, script } = req.query;
    const filename = `${meeting._id}.txt`;

    async function sendTxt() {
        await fs.writeFile(filename, `회의 제목: ${meeting.title}\n회의 일시: ${meeting.date}\n회의 멤버: ${meeting.members.join(', ')}\n\n`, function(err) {
            if (err) {
                console.log(err);
            }
        });

        for (var i = 0; i < script.length; i++) {
            const line = script[i]
            const time = line.time;
            const seconds = parseInt(time % 60);
            const minutes = parseInt((time / 60) % 60);
            const hours = parseInt(time / 3600);
            let timeStr = '';
            if (hours === 0) {
                timeStr = `${minutes < 10 ? `0${minutes}` : minutes}:${seconds < 10 ? `0${seconds}` : seconds}`
            } else {
                timeStr = `${hours}:${minutes < 10 ? `0${minutes}` : minutes}:${seconds < 10 ? `0${seconds}` : seconds}`
            }
    
            const text = `${line.nick}\t${timeStr}\t${line.content}\n`;
    
            await fs.appendFile(filename, text, function(err) {
                if (err) {
                    console.log(err);
                }
            })
        }

        await res.setHeader('Content-Disposition', `attachment; filename=${filename}`); // 이게 핵심 
        res.setHeader('Content-Transfer-Encoding', 'binary');
        res.setHeader('Content-Type', '"application/octet-stream"');
        res.sendFile(path.join(__dirname, '../', filename), function() {
            fs.unlink(path.join(__dirname, '../', filename), err => {
                if (err) {
                    console.log("Error : ", err)
                }
            });
        });
    }

    sendTxt();
}

exports.generateReportTxt = (req, res) => {
    const { meeting, report } = req.query;
    const filename = `${meeting._id}.txt`;

    async function sendTxt() {
        await fs.writeFile(filename, `회의 제목: ${meeting.title}\n회의 일시: ${meeting.date}\n회의 멤버: ${meeting.members.join(', ')}\n\n`, function(err) {
            if (err) {
                console.log(err);
            }
        });

        for (var i = 0; i < report.length; i++) {
            for (var j = 0; j < report[i].length; j++) {
                const rep = report[i][j];

                if (j === 0) {
                    await fs.appendFile(filename, `${i + 1}. ${rep.title}\n`, function(err) {
                        if (err) {
                            console.log(err);
                        }
                    })
                    if (report[i].length === 0) {
                        await fs.appendFile(filename, `\t\t${rep.summary}\n`, function(err) {
                            if (err) {
                                console.log(err);
                            }
                        })
                    }
                } else {
                    await fs.appendFile(filename, `\t${String.fromCharCode(j + 96)}. ${rep.title}\n\t\t${rep.summary}\n`, function(err) {
                        if (err) {
                            console.log(err);
                        }
                    })
                }
            }
        }

        await res.setHeader('Content-Disposition', `attachment; filename=${filename}`); // 이게 핵심 
        res.setHeader('Content-Transfer-Encoding', 'binary');
        res.setHeader('Content-Type', '"application/octet-stream"');
        res.sendFile(path.join(__dirname, '../', filename), function() {
            fs.unlink(path.join(__dirname, '../', filename), err => {
                if (err) {
                    console.log("Error : ", err)
                }
            });
        });
    }

    sendTxt();
}
