const path = require('path');
const fs = require('fs');
const solc = require('solc');

function compile() {
  const contractPath = path.resolve(__dirname, 'SakhiToken.sol');
  if (!fs.existsSync(contractPath)) {
    console.error('SakhiToken.sol not found!');
    process.exit(1);
  }

  const source = fs.readFileSync(contractPath, 'utf8');

  const input = {
    language: 'Solidity',
    sources: {
      'SakhiToken.sol': {
        content: source,
      },
    },
    settings: {
      outputSelection: {
        '*': {
          '*': ['abi', 'evm.bytecode.object'],
        },
      },
    },
  };

  console.log('Compiling SakhiToken.sol...');
  const output = JSON.parse(solc.compile(JSON.stringify(input)));

  if (output.errors) {
    let hasErrors = false;
    output.errors.forEach((err) => {
      console.log(err.formattedMessage);
      if (err.severity === 'error') {
        hasErrors = true;
      }
    });
    if (hasErrors) {
      console.error('Compilation failed due to errors.');
      process.exit(1);
    }
  }

  const contract = output.contracts['SakhiToken.sol']['SakhiToken'];
  const abi = contract.abi;
  const bytecode = contract.evm.bytecode.object;

  const outputPath = path.resolve(__dirname, 'SakhiToken.json');
  fs.writeFileSync(
    outputPath,
    JSON.stringify({ abi, bytecode }, null, 2)
  );

  console.log('Contract compiled successfully! Output written to ' + outputPath);
}

compile();
