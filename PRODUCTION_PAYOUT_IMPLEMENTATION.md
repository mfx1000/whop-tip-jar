# Production-Ready Payout Implementation

## Overview
Implemented accurate payout logic based on actual webhook data from Whop payments, ensuring 80% goes to the company (owner) and 20% goes to the developer, calculated on the exact amount received after Whop's processing fees.

## Key Features

### 1. **Accurate Webhook Processing**
- Uses `amount_after_fees` from payment webhook (actual received amount)
- Calculates splits based on real net amount, not estimates
- Records gross amount, net amount, and fee amount separately

### 2. **Automated Payout Transfers**
- **80% to Company**: Transferred to company's Whop balance
- **20% to Developer**: Transferred to developer's user account
- Uses Whop's `transfers.create()` API with idempotency keys
- Only transfers amounts ≥ $0.01 to avoid unnecessary micro-transactions

### 3. **Accurate Database Records**
- Stores original tip amount (`amount`)
- Stores net amount after fees (`netAmount`)
- Stores actual payout amounts (`companyAmount`, `developerAmount`)
- Stores actual Whop fees (`feeAmount`)
- Includes metadata from checkout process

### 4. **Real-Time Analytics**
- All calculations based on actual received amounts
- Accurate earnings tracking for both company and developer
- Proper fee reporting for transparency

## Implementation Details

### Webhook Processing Flow

1. **Payment Succeeded Event Triggered**
   ```typescript
   webhookData.type === "payment.succeeded"
   ```

2. **Extract Accurate Payment Data**
   ```typescript
   const grossAmount = paymentData.amount / 100; // Convert cents to dollars
   const amountAfterFees = paymentData.amount_after_fees / 100; // Actual received amount
   const feeAmount = paymentData.fee_amount / 100; // Actual Whop fees
   ```

3. **Calculate Precise Splits**
   ```typescript
   const companyAmount = amountAfterFees * 0.8; // 80% to company
   const developerAmount = amountAfterFees * 0.2; // 20% to developer
   ```

4. **Execute Payout Transfers**
   ```typescript
   // Company Transfer
   await whopsdk.transfers.create({
     amount: companyAmount,
     destination_id: companyId,
     origin_id: companyId,
     idempotence_key: `tip_company_${paymentId}`,
   });

   // Developer Transfer
   await whopsdk.transfers.create({
     amount: developerAmount,
     destination_id: developerUserId,
     origin_id: companyId,
     idempotence_key: `tip_developer_${paymentId}`,
   });
   ```

### Database Schema Updates

#### TipTransaction Interface
```typescript
interface TipTransaction {
  amount: number;        // Original tip amount (gross)
  netAmount: number;     // Amount after Whop fees
  companyAmount: number;  // 80% of netAmount
  developerAmount: number; // 20% of netAmount
  feeAmount: number;     // Whop processing fees
  // ... other fields
}
```

## Required Environment Variables

Add these to your `.env.local` file:

```bash
# Developer User ID (replace with your actual Whop user ID)
DEVELOPER_USER_ID=user_YOUR_DEVELOPER_USER_ID

# Whop Webhook Secret (already configured)
WHOP_WEBHOOK_SECRET=your_webhook_secret_here

# Whop API Key (already configured)
WHOP_API_KEY=your_api_key_here

# Firebase Configuration (already configured)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_PRIVATE_KEY=your_private_key
```

## Webhook Events Required

Currently enabled events are sufficient:
- ✅ `payment.succeeded` - Triggers payout processing
- ✅ `payment.failed` - For error handling
- ✅ `dispute.created` - For dispute tracking

**Additional recommended events:**
- `transfer.failed` - To monitor transfer failures
- `transfer.succeeded` - To confirm successful payouts

## Payout Example

### $10 Tip Payment
```
Gross Amount:     $10.00
Whop Fees:         $0.61 (estimated)
Net Amount:         $9.39
Company Receives:    $7.51 (80% of net)
Developer Receives:  $1.88 (20% of net)
```

### $50 Tip Payment
```
Gross Amount:     $50.00
Whop Fees:         $1.75 (estimated)
Net Amount:         $48.25
Company Receives:    $38.60 (80% of net)
Developer Receives:  $9.65 (20% of net)
```

## Error Handling

1. **Transfer Failures**: Logged but don't fail webhook (manual intervention possible)
2. **Duplicate Payments**: Prevented by paymentId uniqueness check
3. **Missing Data**: Validates required fields before processing
4. **Idempotency**: Uses unique keys to prevent double transfers

## Testing

### Local Testing
1. Use `pnpm dev` to start development server
2. Webhook validation is skipped in development mode
3. Test with actual payment processing in Whop environment

### Production Testing
1. Deploy to Vercel
2. Test with real payments
3. Verify transfers in Whop dashboard
4. Check analytics accuracy in tip jar dashboard

## Benefits

✅ **Accurate Splits**: Based on actual received amounts, not estimates
✅ **Transparent**: All fees and amounts recorded accurately
✅ **Automated**: Instant payouts to both parties
✅ **Reliable**: Idempotency prevents double transfers
✅ **Auditable**: Complete transaction history with metadata
✅ **Real-Time**: Analytics updated immediately

## Monitoring

Monitor these logs:
- `Payment breakdown:` - Shows payment processing details
- `Company transfer created:` - Confirms company payouts
- `Developer transfer created:` - Confirms developer payouts
- `Error creating transfers:` - Flags payout issues

The implementation ensures fair and accurate revenue sharing with complete transparency and automation.
