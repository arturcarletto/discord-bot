// utils/python_downloader.js
const { spawn } = require('child_process');
const path = require('path');

function runPythonDownloader(url, interaction) {
    return new Promise((resolve, reject) => {
        const scriptPath = path.join(__dirname, '..', 'downloader', 'main.py');

        // Spawn Python
        const pyProcess = spawn('python', [scriptPath, '--url', url]);

        pyProcess.stdout.on('data', async (data) => {
            const lines = data.toString().trim().split('\n');
            for (const line of lines) {
                // e.g. "PROGRESS 12.34" or "FILE C:\some\path" or "ERROR Something"
                if (line.startsWith('PROGRESS')) {
                    const [_, percentString] = line.split(' ');
                    const percent = parseFloat(percentString);
                    // Attempt to update ephemeral message with progress
                    if (!isNaN(percent)) {
                        try {
                            await interaction.editReply(`Downloading... ${percent}%`);
                        } catch (err) {
                            console.error('[Progress Edit Error]', err);
                        }
                    }
                } else if (line.startsWith('FILE')) {
                    const filePath = line.substring('FILE '.length);
                    resolve(filePath);
                } else if (line.startsWith('ERROR')) {
                    reject(new Error(line.substring('ERROR '.length)));
                }
            }
        });

        pyProcess.stderr.on('data', (errData) => {
            console.error('[Python stderr]', errData.toString());
        });

        pyProcess.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(`Python script exited with code ${code}`));
            }
        });
    });
}

module.exports = {
    runPythonDownloader
};
