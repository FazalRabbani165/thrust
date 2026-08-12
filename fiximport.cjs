var fs = require('fs');
['src/pages/Notes.jsx', 'src/pages/Projects.jsx'].forEach(function(f) {
  var lines = fs.readFileSync(f, 'utf8').split('\n');
  lines[3] = "import Modal from '../components/Modal';";
  fs.writeFileSync(f, lines.join('\n'));
  console.log('Fixed: ' + f);
});
