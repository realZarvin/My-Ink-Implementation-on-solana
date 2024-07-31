# Solana Smart Contract with Anchor

## Overview

This repository demonstrates how to build, test, and deploy a smart contract on the Solana blockchain using the Anchor framework. The project includes a simple token contract, unit tests, and deployment scripts. The goal is to provide a comprehensive example of developing a Rust-based smart contract on Solana, complete with a CI/CD pipeline for automated testing and deployment.

## Features

- **Smart Contract Implementation**: A simple token contract that allows for initialization and transfers.
- **Unit Tests**: Comprehensive tests to ensure the smart contract functions correctly.
- **Deployment Scripts**: Scripts to deploy the contract to a local Solana cluster.
- **CI/CD Pipeline**: Automated testing and deployment using GitHub Actions.

## Prerequisites

- [Rust](https://www.rust-lang.org/tools/install)
- [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools)
- [Anchor CLI](https://project-serum.github.io/anchor/getting-started/installation.html)
- [Node.js](https://nodejs.org/)
- [Docker](https://www.docker.com/get-started)
- [npm](https://www.npmjs.com/)

## Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd solana-smart-contract
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Build the Project

```bash
anchor build
```

### 4. Run Tests

To run the tests, start a local Solana test validator and then run the tests:

```bash
solana-test-validator --reset &
sleep 5
anchor test
```

### 5. Deploy the Smart Contract Locally

You can deploy the smart contract to a local Solana cluster using the provided deployment script:

```bash
./scripts/localnet.sh
```

## Project Structure

```
solana-smart-contract
├── .github
│   └── workflows
│       └── ci.yml
├── anchor
│   ├── migrations
│   ├── programs
│   │   └── my_smart_contract
│   │       ├── src
│   │       │   └── lib.rs
│   │       └── Cargo.toml
│   ├── tests
│   │   └── my_smart_contract.ts
│   ├── Anchor.toml
│   ├── Cargo.lock
│   ├── Cargo.toml
├── migrations
│   └── deploy.js
├── scripts
│   └── localnet.sh
├── .gitignore
├── README.md
└── Dockerfile
```

## Continuous Integration

This repository uses GitHub Actions for CI/CD. The CI pipeline is configured in `.github/workflows/ci.yml` and includes the following steps:

- **Checkout code**: Retrieves the latest code from the repository.
- **Install Rust**: Sets up the Rust toolchain.
- **Install Solana and Anchor**: Installs the necessary Solana and Anchor CLI tools.
- **Build and Test**: Builds the smart contract and runs the tests.

To trigger the CI pipeline, simply push your changes to the `main` branch or open a pull request.

## Smart Contract Details

### Implementation (`lib.rs`)

The smart contract allows for the initialization of a token account with a specified supply and the transfer of tokens between accounts.

```rust
use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg8ETCBLwf7o");

#[program]
mod my_smart_contract {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, initial_supply: u64) -> Result<()> {
        let my_account = &mut ctx.accounts.my_account;
        my_account.supply = initial_supply;
        Ok(())
    }

    pub fn transfer(ctx: Context<Transfer>, amount: u64) -> Result<()> {
        let sender = &mut ctx.accounts.sender;
        let recipient = &mut ctx.accounts.recipient;

        require!(sender.supply >= amount, MyError::InsufficientFunds);

        sender.supply -= amount;
        recipient.supply += amount;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = user, space = 8 + 8)]
    pub my_account: Account<'info, MyAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Transfer<'info> {
    #[account(mut)]
    pub sender: Account<'info, MyAccount>,
    #[account(mut)]
    pub recipient: Account<'info, MyAccount>,
}

#[account]
pub struct MyAccount {
    pub supply: u64,
}

#[error]
pub enum MyError {
    #[msg("Insufficient funds")]
    InsufficientFunds,
}
```

### Unit Tests (`my_smart_contract.ts`)

The tests ensure the contract initializes correctly and handles token transfers as expected.

```typescript
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

    const senderAccount = await program.account.myAccount.fetch(sender.publicKey);
    const recipientAccount = await program.account.myAccount.fetch(recipient.publicKey);

    assert.ok(senderAccount.supply.eq(new anchor.BN(500)));
    assert.ok(recipientAccount.supply.eq(new anchor.BN(500)));
  });
});
```

### Deployment Scripts

**`localnet.sh`**:

```bash
#!/bin/bash

# Start a local Solana test validator
solana-test-validator --reset

# In a separate terminal, run:
# solana-test-validator
```

**`deploy.js`**:

```javascript
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
```

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## Contact

For any questions or support, please contact [zarvinns@gmail.com].


### Conclusion

This `README.md` provides a comprehensive guide to setting up, building, testing, and deploying the Solana smart contract using the Anchor framework. It includes detailed instructions, an overview of the repository structure, and information about the CI/CD pipeline. This documentation will help users and contributors understand and effectively use the repository.
