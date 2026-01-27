import { StyleSheet, View, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/providers/AuthProvider';
import { requestsApi } from '@/services/api/requests';
import { volunteersApi } from '@/services/api/volunteers';
import { useQuery } from '@tanstack/react-query';
import React from 'react';

export default function DashboardScreen() {
  const { user, isDisabledPerson, isVolunteer, isAdmin, signOut } = useAuth();
  const router = useRouter();

  // Queries
  const { data: myRequests, refetch: refetchRequests, isLoading: loadingRequests } = useQuery({
    queryKey: ['myRequests'],
    queryFn: () => requestsApi.listMine(user?.id!),
    enabled: !!user && isDisabledPerson,
  });

  const { data: myAssignments, refetch: refetchAssignments, isLoading: loadingAssignments } = useQuery({
    queryKey: ['myAssignments'],
    queryFn: () => volunteersApi.getMyAssignments(user?.id!, 'active'),
    enabled: !!user && isVolunteer,
  });

  const onRefresh = React.useCallback(() => {
    if (isDisabledPerson) refetchRequests();
    if (isVolunteer) refetchAssignments();
  }, [isDisabledPerson, isVolunteer, refetchRequests, refetchAssignments]);

  const renderRoleContent = () => {
    if (isAdmin) {
      return (
        <View style={styles.section}>
          <ThemedText type="subtitle">Admin Dashboard</ThemedText>
          <Card 
            title="Verifications" 
            description="Manage pending verifications"
            footer={
              <Button variant="outline" onPress={() => console.log('Nav to verifications')}>Review</Button>
            }
          >
            <ThemedText>System overview active.</ThemedText>
          </Card>
        </View>
      );
    }
  };

  const renderDisabledContent = () => {
    if (!isDisabledPerson) return null;
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <ThemedText type="subtitle">My Help Requests</ThemedText>
          <Button size="sm" onPress={() => router.push('/requests/create')}>+ New Request</Button>
        </View>

        {loadingRequests ? (
          <ThemedText>Loading...</ThemedText>
        ) : myRequests && myRequests.length > 0 ? (
          myRequests.map((req: any) => (
            <Card key={req.id} title={`Request #${req.id.slice(0,4)}`} description={req.description}>
               <View style={styles.reqFooter}>
                 <ThemedText style={styles.statusBadge}>{req.status.toUpperCase()}</ThemedText>
                 <Button variant="link" onPress={() => router.push(`/requests/${req.id}`)}>View Details</Button>
               </View>
            </Card>
          ))
        ) : (
          <Card description="You have no active requests. Need help?" style={styles.emptyCard}>
             <Button onPress={() => router.push('/requests/create')}>Request Help</Button>
          </Card>
        )}
      </View>
    );
  };

  const renderVolunteerContent = () => {
    if (!isVolunteer) return null;
    return (
      <View style={styles.section}>
         <View style={styles.sectionHeader}>
          <ThemedText type="subtitle">My Assignments</ThemedText>
          <Button size="sm" variant="secondary" onPress={() => router.push('/(tabs)/explore')}>Find Requests</Button>
        </View>

        {loadingAssignments ? (
          <ThemedText>Loading...</ThemedText>
        ) : myAssignments && myAssignments.length > 0 ? (
           myAssignments.map((assign: any) => (
            <Card 
              key={assign.id} 
              title="Assigned Task" 
              description={assign.request.description}
            >
               <View style={styles.reqFooter}>
                 <ThemedText style={styles.statusBadge}>{assign.request.status.toUpperCase()}</ThemedText>
                 <Button variant="link" onPress={() => router.push(`/requests/${assign.request.id}`)}>View Details</Button>
               </View>
            </Card>
           ))
        ) : (
          <Card description="You have no active assignments.">
            <Button variant="outline" onPress={() => router.push('/(tabs)/explore')}>Browse Feed</Button>
          </Card>
        )}
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loadingRequests || loadingAssignments} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <ThemedText type="title">Hello, {user?.user_metadata?.full_name || 'User'}!</ThemedText>
          <Button variant="ghost" size="sm" onPress={() => signOut()}>Sign Out</Button>
        </View>

        {renderRoleContent()}
        {renderDisabledContent()}
        {renderVolunteerContent()}

      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emptyCard: {
    alignItems: 'center',
    padding: 20,
  },
  reqFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  statusBadge: {
    fontSize: 12,
    fontWeight: 'bold',
    opacity: 0.7,
  }
});