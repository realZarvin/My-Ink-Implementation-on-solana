import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { MySmartContract } from "../target/types/my_smart_contract";
import * as assert from "assert";


describe("my_smart_contract", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);


  const program = anchor.workspace.MySmartContract as Program<MySmartContract>;


  it("Is initialized!", async () => {
    const myAccount = anchor.web3.Keypair.generate();
    await program.rpc.initialize(new anchor.BN(1000), {
      accounts: {
        myAccount: myAccount.publicKey,
        user: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      },
      signers: [myAccount],
    });


    const account = await program.account.myAccount.fetch(myAccount.publicKey);
    assert.ok(account.supply.eq(new anchor.BN(1000)));
  });


  it("Transfers tokens", async () => {
    const sender = anchor.web3.Keypair.generate();
    const recipient = anchor.web3.Keypair.generate();


    await program.rpc.initialize(new anchor.BN(1000), {
      accounts: {
        myAccount: sender.publicKey,
        user: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      },
      signers: [sender],
    });

  
await program.rpc.initialize(new anchor.BN(0), {
      accounts: {
        myAccount: recipient.publicKey,
        user: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      },
      signers: [recipient],
    });

  
await program.rpc.transfer(new anchor.BN(500), {
      accounts: {
        sender: sender.publicKey,
        recipient: recipient.publicKey,
      },
      signers: [sender],
    });

    const senderAccount = await program.account.myAccount.fetch(sender.publicKey);.
    const recipientAccount = await program.account.myAccount.fetch(recipient.publicKey);

    assert.ok(senderAccount.supply.eq(new anchor.BN(500)));
    assert.ok(recipientAccount.supply.eq(new anchor.BN(500)));
  });
});
