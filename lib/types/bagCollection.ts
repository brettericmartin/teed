/**
 * Bag Collection Types
 * For grouping bags into themed collections on profiles
 */

export interface BagCollection {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  emoji: string | null;
  sort_index: number;
  is_featured: boolean;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface BagCollectionItem {
  id: string;
  collection_id: string;
  bag_id: string;
  sort_index: number;
  added_at: string;
}

export type RelationshipType =
  | 'related'
  | 'sequel'
  | 'budget_version'
  | 'premium_version'
  | 'alternative'
  | 'companion';

export interface RelatedBag {
  id: string;
  bag_id: string;
  related_bag_id: string;
  relationship_type: RelationshipType;
  description: string | null;
  sort_index: number;
  created_at: string;
}

// Extended types with joined data
export interface BagCollectionWithBags extends BagCollection {
  bags: CollectionBag[];
}

export interface CollectionBag {
  id: string;
  code: string;
  title: string;
  description: string | null;
  cover_photo_url: string | null;
  is_public: boolean;
  items_count?: number;
  sort_index: number;
}

export interface RelatedBagWithDetails extends RelatedBag {
  related_bag: {
    id: string;
    code: string;
    title: string;
    description: string | null;
    cover_photo_url: string | null;
    is_public: boolean;
    owner: {
      handle: string;
      display_name: string;
    };
  };
}

// For creating/updating collections
export interface CreateBagCollectionInput {
  name: string;
  description?: string;
  emoji?: string;
  is_featured?: boolean;
  bag_ids?: string[];
}

export interface UpdateBagCollectionInput {
  name?: string;
  description?: string;
  emoji?: string;
  is_featured?: boolean;
  is_visible?: boolean;
  sort_index?: number;
}

// For creating related bags
export interface CreateRelatedBagInput {
  bag_id: string;
  related_bag_id: string;
  relationship_type: RelationshipType;
  description?: string;
}

// Helper function to get relationship label
export function getRelationshipLabel(type: RelationshipType): string {
  switch (type) {
    case 'related':
      return 'Related';
    case 'sequel':
      return 'Sequel';
    case 'budget_version':
      return 'Budget Version';
    case 'premium_version':
      return 'Premium Version';
    case 'alternative':
      return 'Alternative';
    case 'companion':
      return 'Companion';
    default:
      return 'Related';
  }
}

// Helper function to get relationship description
export function getRelationshipDescription(type: RelationshipType): string {
  switch (type) {
    case 'related':
      return 'Related bag';
    case 'sequel':
      return 'An updated or follow-up version';
    case 'budget_version':
      return 'A more affordable alternative';
    case 'premium_version':
      return 'A premium upgrade option';
    case 'alternative':
      return 'A different approach to the same need';
    case 'companion':
      return 'Designed to go together';
    default:
      return 'Related bag';
  }
}
