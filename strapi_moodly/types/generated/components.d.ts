import type { Schema, Struct } from '@strapi/strapi';

export interface PrivacyVisibilitySettings extends Struct.ComponentSchema {
  collectionName: 'components_privacy_visibility_settings';
  info: {
    description: 'Controls who can see the details of a mood entry';
    displayName: 'Visibility settings';
  };
  attributes: {
    allowCustomRecipients: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    shareMoodWithAll: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<true>;
    showReasonToHr: Schema.Attribute.Enumeration<
      ['hidden', 'anonymized', 'visible']
    > &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'visible'>;
    showReasonToManagers: Schema.Attribute.Enumeration<
      ['hidden', 'anonymized', 'visible']
    > &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'visible'>;
    showReasonToPeers: Schema.Attribute.Enumeration<
      ['hidden', 'anonymized', 'visible']
    > &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'anonymized'>;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'privacy.visibility-settings': PrivacyVisibilitySettings;
    }
  }
}
