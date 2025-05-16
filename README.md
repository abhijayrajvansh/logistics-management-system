## database
```typescript
// Centers Table
centers {
    id: primary key
    name: string
    location: string
    pincode: string
}

// Clients Table
clients {
    id: primary key
    name: string
    pincode: string
}

// Receivers Table
receivers {
    id: primary key
    name: string
    pincode: string
}

// TAT Mappings Table
tat_mappings {
    id: primary key
    center_id: foreign key
    client_id: foreign key
    receiver_id: foreign key
    tat_value: integer (in days)
    created_at: timestamp
    updated_at: timestamp
}
```

### Key Features
#### Hierarchical Structure:

- Centers → Clients → Receivers → TAT values
- Each combination can have a unique TAT

#### Lookup Strategy:

- Primary lookup: Based on exact center-client-receiver combination
Secondary lookup: Based on pincode proximity if exact match not found


2 functions:
- getTAT(clientId: string, receiverId: string, centerId: string): Promise<number>;
- updateTAT(clientId: string, receiverId: string, centerId: string, tatValue: number): Promise<void>;

some imp notes: Implementation Considerations
Caching:

Cache frequently accessed TAT values
Implement cache invalidation on updates
Search Optimization:

Index on (center_id, client_id, receiver_id) combination
Consider using a geospatial index for pincode-based lookups
Business Rules:

Default TAT values for new combinations
Validation rules for TAT values
Handle special cases (holidays, weekends)

```typescript
// Example usage in order creation
async function createOrder(clientId: string, receiverId: string, centerId: string) {
    const tatService = new TATService();
    const tat = await tatService.getTAT(clientId, receiverId, centerId);
    
    const deliveryDate = addBusinessDays(new Date(), tat);
    
    // Create order with calculated delivery date
    return new Order({
        clientId,
        receiverId,
        centerId,
        expectedDeliveryDate: deliveryDate,
        tat
    });
}
```