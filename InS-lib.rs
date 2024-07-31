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
