const spawn = require('child_process').spawn;
var path = require('path');

exports.generateDocx = (req, res) => {
    const { meeting, report } = req.query;
    const python = spawn('venv/bin/python3.9', ['./python/test.py', JSON.stringify(meeting), JSON.stringify(report)]);

    python.stdout.on('data', function(result) {
        const filename = `${result.toString().replace(/\n/g, "")}.docx`;  
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`); // 이게 핵심 
        res.setHeader('Content-Type', '"application/octet-stream"');
        res.sendFile(path.join(__dirname, '../', filename));
    });

    python.stderr.on('data', function(data) {
        console.log(data.toString());
        res.send(data.toString());
    });
}
