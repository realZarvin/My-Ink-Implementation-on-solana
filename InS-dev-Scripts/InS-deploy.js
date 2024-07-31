const anchor = require('@project-serum/anchor');


async function main() {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const idl = JSON.parse(
    require('fs').readFileSync('./target/idl/my_smart_contract.json', 'utf8')
  );

  
  const programId = new anchor.web3.PublicKey('YOUR_PROGRAM_ID');
  const program = new anchor.Program(idl, programId);

  await program.methods
    .initialize(new anchor.BN(1000))
    .accounts({
      myAccount: anchor.web3.Keypair.generate().publicKey,
      user: anchor.AnchorProvider.local().wallet.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .rpc();
}


console.log('Deploying...');
main().then(() => console.log('Deployed!'));
